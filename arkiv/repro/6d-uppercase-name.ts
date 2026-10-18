// friction.md 6d — an uppercase attribute name is rejected only when the tx is sent,
// and the error lists "A"-"Z" as allowed while rejecting "H".
// Needs a funded key in .env.local (ONRECORD_PRIVATE_KEY). Run: npx tsx arkiv/repro/6d-uppercase-name.ts
import "../../scripts/env";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";
import { walletClient } from "../../lib/arkiv";

try {
  await walletClient().createEntity({
    payload: jsonToPayload({ repro: "6d" }),
    contentType: "application/json",
    attributes: { app: "onrecord-repro", contentHash: "abc" },
    expires: ExpirationTime.fromDays(1),
  });
  console.log("accepted (behaviour changed since SDK 0.8.1)");
} catch (e) {
  console.log("rejected:", String((e as Error).message).split("\n")[0]);
}
