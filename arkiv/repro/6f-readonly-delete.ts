// friction.md 6f — `readonly` stops edits, NOT the owner's delete.
//   A: readonly entity we own        -> our delete SUCCEEDS
//   B: readonly entity burned to 0x…dEaD in its creating tx -> our delete REVERTS
// Needs a funded key. Writes 2 tiny entities (1-day expiry, app=onrecord-repro).
// Run: npx tsx arkiv/repro/6f-readonly-delete.ts
import "../../scripts/env";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { publicClient, walletClient } from "../../lib/arkiv";
import { BURN } from "../../lib/config";

const w = walletClient();
const base = (tag: string) => ({
  payload: jsonToPayload({ repro: "6f", tag }),
  contentType: "application/json" as const,
  attributes: { app: "onrecord-repro", case: tag },
  expires: ExpirationTime.fromDays(1),
  flags: { readonly: true },
});

const a = await w.createEntity(base("A"));
try {
  await w.deleteEntity({ entityKey: a.entityKey });
  console.log("A readonly, owned by us  -> delete SUCCEEDED (readonly does not stop delete)");
} catch (e) {
  console.log("A delete refused:", String((e as Error).message).split("\n")[0]);
}

const [k] = await publicClient().predictEntityKeys({ owner: w.account.address, count: 1 });
await w.executeBatch({
  creates: [{ ...base("B"), salt: k.salt }],
  ownershipChanges: [{ entityKey: k.key, newOwner: BURN }],
});
try {
  await w.deleteEntity({ entityKey: k.key });
  console.log("B delete SUCCEEDED (unexpected)");
} catch (e) {
  console.log("B readonly + owned by 0x…dEaD -> delete REVERTED:", String((e as Error).message).split("\n")[0].slice(0, 120));
}
