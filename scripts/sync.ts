// CLI witness pass. Run: npm run sync -- <channelHandle> [more...]
import "./env";
import { syncChannel } from "../lib/witness";

const handles = process.argv.slice(2).filter((a) => !a.startsWith("-"));
if (handles.length === 0) {
  console.error("Usage: npm run sync -- <channelHandle> [more...]");
  process.exit(1);
}
for (const h of handles) {
  try {
    const r = await syncChannel(h);
    console.log(
      `@${r.channel} "${r.title ?? ""}": ${r.visible} visible, +${r.written} witnessed, ${r.calls} calls, ${r.tombs} tombstones`,
    );
    for (const tx of r.txHashes) console.log("  tx " + tx);
  } catch (err) {
    console.error(`@${h} failed:`, (err as Error).message);
  }
}
