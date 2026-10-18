# OnRecord — Arkiv schema

All entities are written to **Tiramisu** (chain id `7738577`) by the witness wallet and
namespaced with `app = "onrecord"`. Attributes are the queryable surface; payloads hold
the full JSON record. Times are unix seconds stored as `u64` so they range-query.

Witness wallet (creates all entities below): see `WALLETS.md` / Devfolio submission.

## Creation flags (fixed at creation, cannot change)

| Type | `readonly` | `permissionlessExtension` | Why |
|---|---|---|---|
| `msg` | ✓ | ✓ | Evidence: not even the witness can edit its own testimony; anyone can keep it alive |
| `tomb` | ✓ | ✓ | Same — deletion evidence must be tamper-proof and community-renewable |
| `call` | ✓ | ✗ | A tip is time-scoped: nobody can resurrect stale alpha past its validity |

## Writes

A witness pass is written with `executeBatch({ creates })` in chunks of 20, so one page
snapshot lands in one block under one timestamp. The UI's "keep alive +30d" calls
`extendEntity` with `ExpirationTime.atBlock(currentExpiry + 30 days of blocks)` —
Lifetime Extension that always moves the deadline later, never resets it.

## Entity types

### `type = "msg"` — a witnessed channel message
One entity per public Telegram message we have observed, written at first sight.

| Attribute | Type | Meaning |
|---|---|---|
| `app` | str | `"onrecord"` |
| `type` | str | `"msg"` |
| `channel` | str | Telegram handle, no `@` |
| `msg_id` | u64 | Telegram per-channel sequential message id |
| `kind` | str | `call` / `claim` / `promo` / `other` (classifier output) |
| `content_hash` | str | sha256 of `channel/msgId:normalizedText` |
| `seen_at` | u64 | when this witness first saw it |

Payload (`application/json`): `{ v, channel, msgId, kind, text?, hasMedia, postedAt?, sha256 }`.
`text` is stored **only** for `call` and `claim` messages (market statements used for
scoring); promos and chatter are witnessed as hash only. Channel posts are anonymous
broadcast marketing; no personal data is stored (see Privacy below).

**Expiration: 60 days.** Raw witness records are evidence for scoring, not an archive;
once aggregated they may lapse. Anyone who wants a record preserved can extend it —
contested evidence stays alive exactly as long as someone cares (Lifetime Extension as
a community-renewed lease).

### `type = "call"` — a committed, parseable trade call
Written when a `msg` parses into a falsifiable call (instrument/side with target or SL).

| Attribute | Type | Meaning |
|---|---|---|
| `app`, `channel`, `msg_id`, `seen_at` | | as above |
| `type` | str | `"call"` |
| `instrument` | str | e.g. `BANKNIFTY`, `NIFTY`, `RELIANCE 2500 CE`, `unknown` |
| `side` | str | `buy` / `sell` / `unknown` |

Payload: `{ v, channel, msgId, instrument?, side?, entry?, target?, stoploss?, committedAt }`.

**Expiration: 3 days — the call's own validity.** Created `readonly` without
permissionless extension. A trading tip is a time-scoped claim;
when the tip is stale, the entity lapses by physics. The graded aggregate (the
scoreboard) is recomputed from `msg` records and does not depend on expired `call`
entities surviving.

### `type = "tomb"` — a deletion tombstone
Written when a previously-witnessed `msgId` disappears from the channel's public page
while the page still covers its id range: the message was deleted at source.

| Attribute | Type | Meaning |
|---|---|---|
| `app`, `channel`, `msg_id`, `seen_at` | | as above |
| `type` | str | `"tomb"` |

Payload: `{ v, channel, msgId, confirmedGoneAt, note }`.

**Expiration: 180 days.** Deletion evidence must outlive the raw messages it indicts —
it is the core integrity signal (survivorship manufacturing made visible).

## Queries the app runs

- Scoreboard for a channel (all witnessed messages):
  `select({key, attributes, payload}).where(and(eq("app","onrecord"), eq("type","msg"), eq("channel", H)))` — paginated via the async iterator.
- Deletions: same with `type = "tomb"`.
- Watched-channel directory: `select({attributes}).where(and(eq("app","onrecord"), eq("type","msg")))`, distinct `channel` client-side.
- Dedupe inside the witness: the same queries, collecting `msgId` into a set before
  writing (no `ne`/`orderBy` on chain; `msgId`/`seenAt` are numeric so range filters
  remain available for time-windowed views).

## Integrity metrics (computed, not stored)

- **claims-without-calls** = `count(kind=claim) − count(kind=call)`, floored at 0 — profit
  claims with no prior committed call are unfalsifiable marketing.
- **deletions** = `count(type=tomb)` — the survivorship score.

## What deliberately stays OFF Arkiv

- **Message media** (photos of P&L screenshots): witnessed as part of the content hash
  only; blobs don't belong in 128 KiB entities.
- **Personal data**: none. No subscriber data, no names, no phone numbers; channel
  operators are anonymous broadcast identities. Text is stored only for call/claim
  market statements. No private keys or secrets, plaintext or hashed.
- **Market price data** for grading: public exchange data, fetched at read time.
- The **web UI** itself: anyone can read the same record straight from the public RPC
  without our frontend — judges can verify every row via the explorer links.
