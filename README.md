# OnRecord — the witness that can't be bought

**Paste a tipster's channel. See their real record — including the calls they deleted.**

SEBI found **93% of individual F&O traders lost money** between FY22 and FY24 — ₹1.8
lakh crore, averaging ₹2 lakh per person — and a huge share of them trade on tips from
Telegram "calls" channels (single channels reach **500k+ subscribers**, selling premium
groups at ₹2,200–₹4,500 with "no demo, no refunds"). The industry's sales weapon is the
track record — and every track record is self-reported, cherry-picked, edited, and
deleted at will. **Every fraud in this market is a database edit.**

OnRecord is an adversarial witness built on **Arkiv**, the Web3 database:

- Every public message of a watched channel is **notarized to Arkiv within seconds**
  of being seen — content hash, classification, timestamp, as a queryable entity.
- When a losing call is quietly deleted, the chain still holds it: the deletion itself
  becomes a **tombstone** on the channel's public scoreboard.
- "PROFIT BOOKED ✅" posts are counted against the calls actually **committed
  beforehand**. In our first real test channel's 20 visible messages: two "ACCOUNT
  HANDLING LIVE PROFIT BOOKED ✅" posts, a premium price ticking up "232🔥 234🔥 236🔥…"
  — and **zero** publicly committed calls.
- Nobody — not the tipster, not a platform, not us — can edit the record. Witnessing
  is permissionless: a channel cannot opt out of being accountable for what it
  broadcast publicly.

## Why Arkiv (what breaks anywhere else)

A witness run on our own Postgres is just another screenshot: a ₹20-crore
pump-and-dump operation (SEBI's May 2026 order) can buy, sue, or DDoS a startup's
database into silence — and the record-keeper becomes the counterparty again. On
Arkiv the record survives us: every row on the scoreboard links to a public explorer
entity any judge, trader, or regulator can verify without our backend. `$creator`
separates independent witnesses co-attesting the same channel. And expiry is product
logic, not cleanup: **a trading call is a time-scoped claim** (call entities lapse
with their own validity), raw witness records age out after grading, while deletion
tombstones outlive the messages they indict.

What SEBI's new **PaRRVA** regime (live May 2026) verifies is portfolio performance
for ~2,000 *registered* advisors. The ₹1.8-lakh-crore harm happens in the
*unregistered* channels PaRRVA can never reach. OnRecord is the permissionless
complement: verification that doesn't need the fraudster's enrollment.

## Run it

```bash
npm install
npm run wallet            # generates the witness wallet into .env.local
# fund the printed address at https://hub.arkiv.network/faucet (test GLM)
npm run sync -- bulltrade_observation   # witness a real channel
npm run dev               # open http://localhost:3000
```

Network: Arkiv **Tiramisu** testnet, chain id `7738577`
(`https://rpc.tiramisu.db-chain.testnet.arkiv.network`).

Check any channel's record yourself, with no key and no OnRecord server:

```bash
npm run verify -- bulltrade_observation
```

It reads Tiramisu directly and checks every entity: created by the witness wallet,
owned by `0x…dEaD` (nobody can delete it, us included), `readonly` (nobody can edit
it), and the content hash matches.

- [`arkiv/schema.md`](arkiv/schema.md) — entity types, attributes, lifetimes, queries
- [`arkiv/friction.md`](arkiv/friction.md) — expected-vs-actual build log on SDK 0.8.1

## On-chain evidence (Tiramisu)

- Witness wallet (creates every OnRecord entity):
  [`0x3e4d746d07568B5d0BE5b6C83937c6FCd741e7fc`](https://data.arkiv.network/owner/0x3e4d746d07568B5d0BE5b6C83937c6FCd741e7fc?chain=tiramisu)
- Query to reproduce the scoreboard ([open it in the Data Explorer](https://data.arkiv.network/?chain=tiramisu&q=app%20%3D%20str('onrecord')%20AND%20type%20%3D%20str('msg')%20AND%20channel%20%3D%20str('bulltrade_observation'))):
  `app = str('onrecord') AND type = str('msg') AND channel = str('bulltrade_observation')`
  — all 20 entities of the first pass share one transaction hash: one atomic `executeBatch`.
- Every entity is owned by `0x000000000000000000000000000000000000dEaD`. New writes are
  handed over in the creating transaction; the first 28 were handed over in
  [`0x26a9de6d…`](https://tiramisu.explorer.arkiv.network/tx/0x26a9de6d9242dcb202de03d66b54c8f143a1d9e2083bc84dcca8da2ba8d50976)
  and [`0xce0cff1e…`](https://tiramisu.explorer.arkiv.network/tx/0xce0cff1e2284f98060db16d1ba86ca8140c2fbe6825aee35cfb2887203d83cfa).
  A delete from the witness key now reverts: `entity … is owned by 0x…dEaD, not 0x3e4d…`.
- Reads filter by `$creator` (`.createdBy(witness)`), so an entity another wallet
  writes with `app = "onrecord"` never shows up.
- Example witnessed claim (readonly + permissionlessExtension):
  [`0xb2a791f7…0c548c`](https://data.arkiv.network/entity/0xb2a791f7cf143506d218921568e9425f082479ce215453a6c4baaaf1700c548c?chain=tiramisu)

## Honest limits

- We witness **public** previews (`t.me/s/`). Channels that disable the public preview
  can't be witnessed externally — that restriction is itself a signal we surface.
- Image-only posts (P&L screenshots) are witnessed as hashes, not OCR'd (yet).
- Deletion detection is bounded by the preview window: we can only tomb messages we
  witnessed before deletion and whose id range the page still covers.
- The classifier is heuristic; `call` parsing is conservative (entry/target/SL
  required) so claimed-vs-committed stays unfalsifiable-proof, not vibes.
- Integrity ≠ quality: OnRecord proves whether an author stands behind their record,
  not whether a tip is good. Nothing here is investment advice.

## License

MIT
