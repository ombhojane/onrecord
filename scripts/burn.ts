// Hands every OnRecord entity the witness still owns to 0x…dEaD, in batches.
// After this, no key can delete the evidence — including ours. Run: npx tsx scripts/burn.ts
import "./env";
import { eq } from "@arkiv-network/sdk/query";
import { publicClient, walletClient } from "../lib/arkiv";
import { APP_TAG, BURN, WITNESS } from "../lib/config";

const keys: `0x${string}`[] = [];
for await (const e of publicClient()
  .select({ key: true })
  .where(eq("app", APP_TAG))
  .createdBy(WITNESS)
  .ownedBy(WITNESS)) {
  keys.push(e.key as `0x${string}`);
}
console.log(`${keys.length} entities still owned by the witness`);
for (let i = 0; i < keys.length; i += 25) {
  const { txHash } = await walletClient().executeBatch({
    ownershipChanges: keys.slice(i, i + 25).map((entityKey) => ({ entityKey, newOwner: BURN })),
  });
  console.log("tx", txHash);
}
