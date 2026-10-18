// Dry run: fetch + classify a channel, no chain writes. npm exec tsx scripts/probe.ts -- <handle>
import { fetchChannel } from "../lib/ingest";
import { classify } from "../lib/classify";

const handle = process.argv[2] ?? "nifty_banknifty_zero_hero_to";
const page = await fetchChannel(handle);
console.log(`@${page.handle} — "${page.title}" — ${page.subscribers} subscribers`);
for (const m of page.messages) {
  const c = classify(m.raw);
  const preview = c.text.replace(/\n/g, " ⏎ ").slice(0, 90);
  console.log(
    `#${m.msgId} [${c.kind}]${m.hasMedia ? " 📷" : ""} ${preview}${c.call ? " → " + JSON.stringify(c.call) : ""}`,
  );
}
