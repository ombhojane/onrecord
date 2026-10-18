// Independent check of a channel's record, straight from Arkiv. Needs no key, no
// OnRecord server and no trust in our website. Run: npm run verify -- <channel>
//
// For every entity it checks:
//   1. creator  — written by the witness wallet ($creator is set by the chain, not by us)
//   2. owner    — handed to 0x…dEaD, so no key can delete or re-own it (ours included)
//   3. flags    — readonly: the payload and attributes can never be edited
//   4. hash     — the content_hash attribute matches the payload, and where the post
//                 text is stored (calls, profit claims) it re-hashes to the same value
import { and, eq } from "@arkiv-network/sdk/query";
import { avNum, avStr, publicClient } from "../lib/arkiv";
import { APP_TAG, BURN, WITNESS, entityUrl } from "../lib/config";
import { sha256Hex } from "../lib/normalize";

const channel = (process.argv[2] ?? "").replace(/^@/, "").toLowerCase();
if (!channel) {
  console.error("Usage: npm run verify -- <channel>");
  process.exit(1);
}

const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
const tally = { total: 0, creator: 0, burned: 0, readonly: 0, hashOk: 0, rehashed: 0, bad: [] as string[] };
const kinds: Record<string, number> = {};

for await (const e of publicClient()
  .select({ key: true, owner: true, creator: true, creationFlags: true, attributes: true, payload: true })
  .where(and(eq("app", APP_TAG), eq("channel", channel)))
  .createdBy(WITNESS)) {
  const x = e as unknown as Record<string, unknown> & { toJson: () => Record<string, unknown> };
  const a = (x.attributes ?? {}) as Record<string, unknown>;
  const type = avStr(a.type) ?? "?";
  const kind = type === "msg" ? avStr(a.kind) ?? "other" : type;
  kinds[kind] = (kinds[kind] ?? 0) + 1;
  tally.total++;
  const problems: string[] = [];

  if (same(x.creator as string, WITNESS)) tally.creator++; else problems.push("creator");
  if (same(x.owner as string, BURN)) tally.burned++; else problems.push("owner");
  const flags = x.creationFlags as { readonly?: boolean } | undefined;
  if (flags?.readonly) tally.readonly++; else problems.push("not readonly");

  if (type === "msg") {
    let p: Record<string, unknown> = {};
    try { p = x.toJson(); } catch {}
    const attrHash = avStr(a.content_hash);
    if (attrHash && attrHash === p.sha256) tally.hashOk++; else problems.push("hash attr ≠ payload");
    if (typeof p.text === "string") {
      const h = await sha256Hex(`${channel}/${avNum(a.msg_id)}:${p.text}`);
      if (h === attrHash) tally.rehashed++; else problems.push("text does not re-hash");
    }
  }
  if (problems.length) tally.bad.push(`${entityUrl(String(x.key))}  ${problems.join(", ")}`);
}

const msgs = Object.entries(kinds).filter(([k]) => !["call", "tomb"].includes(k)).reduce((s, [, n]) => s + n, 0);
console.log(`@${channel} — ${tally.total} entities created by ${WITNESS}`);
console.log(`  by kind:          ${JSON.stringify(kinds)}`);
console.log(`  created by witness ${tally.creator}/${tally.total}`);
console.log(`  owned by 0x…dEaD   ${tally.burned}/${tally.total}   (nobody can delete them)`);
console.log(`  readonly           ${tally.readonly}/${tally.total}   (nobody can edit them)`);
console.log(`  hash matches       ${tally.hashOk}/${msgs}`);
console.log(`  text re-hashed     ${tally.rehashed}   (calls and profit claims keep their text)`);
console.log(tally.bad.length ? `\n${tally.bad.length} problem(s):\n${tally.bad.join("\n")}` : "\nAll checks pass.");
