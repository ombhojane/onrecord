// friction.md 6b — attribute values read back as tagged objects, not plain values.
// Read-only, needs no key. Run: npx tsx arkiv/repro/6b-tagged-values.ts
import { and, eq } from "@arkiv-network/sdk/query";
import { publicClient } from "../../lib/arkiv";
import { WITNESS } from "../../lib/config";

for await (const e of publicClient()
  .select({ attributes: true })
  .where(and(eq("app", "onrecord"), eq("type", "msg")))
  .createdBy(WITNESS)) {
  const a = e.attributes as Record<string, unknown>;
  console.log("msg_id as read back:", a.msg_id);
  console.log("Number(msg_id)      :", Number(a.msg_id), "  <- NaN: written as u64(n), read back as { type, value }");
  console.log("typeof channel      :", typeof a.channel, "  <- expected 'string'");
  break;
}
