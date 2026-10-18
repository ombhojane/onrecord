# Friction report — building OnRecord on Arkiv (SDK 0.8.1, Tiramisu)

Items 6b, 6d, 6e, 6f and 6g each have a script in [`arkiv/repro/`](repro/) that
reproduces them against Tiramisu. Output from our last run (18 Oct 2026):

```
6b  msg_id as read back: { type: 'u64', value: 3n }   Number(msg_id): NaN
6d  rejected: an attribute name holds "H" (0x48) at byte 7, which is outside the
    name charset ("A"-"Z", "a"-"z", ...)
6e  app = str('onrecord') AND type = str('msg') AND channel = str('bulltrade_observation')
6f  A readonly, owned by us        -> delete SUCCEEDED
    B readonly + owned by 0x…dEaD  -> delete REVERTED: entity … is owned by 0x…dEaD
6g  wallet client has predictEntityKeys at runtime: false
```

Environment: macOS, Node 22.14, `@arkiv-network/sdk@0.8.1` (+ `viem` peer), Next.js 15.
Written as a running log during the build (Oct 18, 2026). Expected vs actual, with
repro where useful.

## 1. The faucet is wallet-connect-only — agents and CI can't fund themselves
**Expected:** a POST endpoint or CLI (`arkiv faucet <address>`) like most testnets.
**Actual:** https://hub.arkiv.network/faucet requires an interactive wallet connection;
docs (`/networks/tiramisu/`) document no API. Our witness runs headless with a
generated key (`privateKeyToAccount`), so a human had to click the faucet — the single
biggest onboarding stall of the project, and it will bite every agent-shaped use case
you are courting. **Fix first:** a rate-limited `POST /faucet {address}` (even
captcha-gated) or a Discord bot command.

## 2. Docs/SDK drift: the README teaches 0.6-era surface, write APIs are undocumented
**Expected:** README/docs cover `extendEntity`, `deleteEntity`, `patchEntity`,
`watchEntityEvents`, `changeOwnership`.
**Actual:** the package README (titled "arkivjs", dependency block showing `^0.6.0`)
documents only `createEntity` + queries; we had to read `dist/*.d.ts` and `src/` to
learn the rest (e.g. `ExpirationTime.atDate`, `atBlock({atLeast})`, `permanent()` —
genuinely nice APIs, invisible in docs). AGENTS.md's "verify against the package" is
honest but it means every builder re-derives the API from types under deadline.
**Fix:** generated API reference from the `.d.ts`, linked from the README.

## 3. `ExpirationTime` seconds must be multiples of block time (2s)
**Expected:** any positive seconds value.
**Actual:** `fromSeconds(s)` throws unless `s % 2 === 0` (found in
`src/entity/expiry.ts`; error message suggests the rounding yourself). Harmless once
known, but `fromSeconds(5)` failing with a lecture is the kind of papercut a
`round: "up"` option would erase.

## 4. Entity expiry emits no event — our tombstone logic had to be rethought
**Expected:** subscribe to expirations to mark calls as lapsed.
**Actual:** documented behavior: expiry is passive; `watchEntityEvents` needs a
WebSocket transport and silently degrades to polling over HTTP. We compute lapse
client-side from `$expiresAt`-style reasoning (call lifetime = 3 days) instead. An
`expired` event stream — even best-effort — would unlock the "trigger on expiry"
category your own ecosystem page asks for ("Arkiv triggers").

## 5. No server-side `orderBy`, no `ne` — scoreboards sort client-side
**Expected:** `ORDER BY msgId DESC LIMIT 50` for a channel timeline.
**Actual:** by design (AGENTS.md); we fetch all pages via the async iterator and sort
in process. Fine at hackathon scale; at 10⁵ messages per channel the full-scan pattern
will hurt. A `orderBy($createdAt)` on numeric attributes would remove the most common
client-side workaround we wrote.

## 6. `executeBatch` and creation flags exist — but only in the type definitions
**Expected:** docs for atomic multi-entity writes and creation flags.
**Actual:** we first wrote one `createEntity` per message and assumed no batch API
existed (an earlier draft of this report said so — that was wrong). Reading
`src/actions/wallet/executeBatch.ts` revealed `executeBatch({ creates, patches,
deletes, extensions, ownershipChanges })` — exactly what a witness needs: a whole page
snapshot lands in one block with one timestamp. Likewise `flags: { readonly,
permissionlessExtension }` (from `entity/flags.ts`) turned out to be the most
product-defining feature we used: evidence nobody (including us) can edit, which
anyone can keep alive. Neither appears in the README or the docs pages we read.
**Fix:** a "Batch writes" and a "Creation flags" page — these are your
differentiators, and they are invisible.

## 6b. Attribute values read back as tagged objects — silent `NaN` in our dedupe
**Run it:** [`arkiv/repro/6b-tagged-values.ts`](repro/6b-tagged-values.ts) (`npx tsx arkiv/repro/6b-tagged-values.ts`)
**Repro:** create with `msgId: u64(5807n)`, then
`select({ attributes: true })` → `e.attributes.msgId` is `{ type: "u64", value: 5807n }`,
not `5807n`. `Number(e.attributes.msgId)` → `NaN`; `typeof a.channel === "string"` →
`false`. No type error at the call site because we read through `unknown`.
**Impact:** our "already witnessed?" set came back empty, so every refresh would have
re-written every message. Caught by a type error elsewhere (comparing `AnyArkivValue` to
a string), not by the read path. **Fix:** a documented `value(attr)` helper, or a
`select({ attributes: "plain" })` mode; at minimum show the read-back shape in the
README next to the write example.

## 6c. Data Explorer deep links don't document the chain parameter
`https://data.arkiv.network/entity/<key>` is documented; that Tiramisu needs
`?chain=tiramisu` we found by reading the explorer's own nav links. Every proof link
in a hackathon submission depends on this.

## 6d. Attribute names reject uppercase — with an error that says uppercase is allowed
**Run it:** [`arkiv/repro/6d-uppercase-name.ts`](repro/6d-uppercase-name.ts) (`npx tsx arkiv/repro/6d-uppercase-name.ts`)
**Repro:** `createEntity({ attributes: { contentHash: "…" }, … })` (SDK 0.8.1, Tiramisu).
**Actual:** `Transaction failed: an attribute name holds "H" (0x48) at byte 7, which is
outside the name charset ("A"-"Z", "a"-"z", "0"-"9", ".", "-" and "_", with a letter first)`.
The message lists `A-Z` as allowed while rejecting `H`. It only surfaced on our first
funded write (the SDK did not validate client-side), costing a round trip at the worst
moment. We renamed to `content_hash` / `msg_id` / `seen_at`. **Fix:** validate names in
the SDK before signing, and correct the charset in the error.

## 6e. Data Explorer query errors don't point at the actual mistake
**Run it:** [`arkiv/repro/6e-explorer-quotes.ts`](repro/6e-explorer-quotes.ts) (`npx tsx arkiv/repro/6e-explorer-quotes.ts`)
**Repro (Tiramisu, data.arkiv.network):**
- `app = str("onrecord") AND …` (double quotes) → `Query rejected (literal, -32003):
  Transaction creation failed.` — a query is not a transaction.
- `app = "onrecord" && …` → `Query rejected (parse, -32001): Requested resource not found.`
- `app = str('onrecord') AND …` (single quotes) → works, 20 of 20 entities.
We only found the accepted form by calling the SDK's `render()` on our own predicate.
**Fix:** say "string literals use single quotes" in the error, and show the
`render()` output of a TypeScript query in the explorer's TypeScript panel.

## 6f. `readonly` does not stop the owner deleting — we nearly shipped a false claim
**Run it:** [`arkiv/repro/6f-readonly-delete.ts`](repro/6f-readonly-delete.ts) (`npx tsx arkiv/repro/6f-readonly-delete.ts`)
**Expected:** `readonly: true` means the evidence can't be removed, which is what our
first README and submission draft said.
**Actual:** the `CreationFlags` doc comment (SDK 0.8.1) says a readonly entity can still
be "ownership transferred, and the entity deleted". So our "nobody can delete it, us
included" was false until we burned ownership: `predictEntityKeys` → `executeBatch({
creates, ownershipChanges: [{ entityKey, newOwner: 0x…dEaD }] })`. After that, a delete
from our own key reverts with `entity … is owned by 0x…dEaD, not 0x3e4d…`.
**Fix:** say it on the flags page, in the name if possible: "readonly (edit-proof, not
delete-proof)". Most teams will read `readonly` the way we did.

## 6g. `predictEntityKeys` isn't on the wallet client
**Run it:** [`arkiv/repro/6g-predict-type.ts`](repro/6g-predict-type.ts) (`npx tsx arkiv/repro/6g-predict-type.ts`)
**Repro (SDK 0.8.1):** `walletClient().predictEntityKeys({ owner, count })` → TypeScript
`TS2339: Property 'predictEntityKeys' does not exist`, and at runtime the property is
`undefined` too, although the wallet client's doc says it carries "the read actions a
Public Client has". `publicClient().predictEntityKeys` works. Minor, but it sits on the one path (predict → batch → hand over ownership) that
makes evidence undeletable, so it's worth getting right.

## 7. Things that were genuinely smooth
- The SDK ships query-injection tests (`src/query/injection.test.ts`) and typed `attr`
  constructors; that is why we pass a user-supplied channel handle into `eq()` after
  only a charset check.
- `watchEntityEvents` over a WebSocket transport worked first try from the browser:
  our header's live heartbeat received Tiramisu entity events within seconds of page
  load, with no polling fallback.
- Cost: our first witness passes wrote 28 entities in 3 batch transactions for ~0.0033
  test GLM total; a re-run correctly wrote nothing (dedupe by `msg_id` query).
- `extendEntity` with `ExpirationTime.atBlock(current + 30 days)` worked first try from
  the UI: a receipt's remaining life went 59d → 89d, visible in the Data Explorer.
- `ExpirationTime.atBlock` / `atDate` / `permanent()` made "a call lives exactly as long
  as its validity" a one-liner.

## One thing to improve first
**Ship a programmatic faucet.** Everything else above is a papercut; #1 is a wall.
Your pitch is "the database for agents," and agents cannot click "Connect wallet."
