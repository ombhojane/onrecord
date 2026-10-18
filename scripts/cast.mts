// Generates the bazaar cast one character at a time, style-locked to a reference panel.
// Usage: npx tsx scripts/cast.mts <reference.png> [onlyName]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const env = readFileSync("/Users/omi/products/resources/.env", "utf8");
const key = env.match(/^openai=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("no openai key");

const ref = process.argv[2];
const only = process.argv[3];
mkdirSync("public/cast", { recursive: true });

const FRAME = `Draw ONLY ONE single character, completely isolated, on a fully transparent background — no other people, no ground, no shadow, no scenery, no text. Match the reference image's style EXACTLY: flat vector sticker style, the same thin uniform charcoal outline weight, the same minimal dot-and-line face style, the same flat fills, the same palette (charcoal #17140F, brick red #E2412E, warm yellow #FFE45C, soft green #9FD9AE, lilac #CDBBF5, warm skin tones, white). FRAMING (identical for every character in the series): square canvas, the character is shown from the waist up and centred horizontally, the body is cut off cleanly at the waist exactly at the bottom edge of the canvas, the top of the head sits at about 38% down from the top of the canvas, and the head is about 22% of the canvas height. Raised arms or held props may extend into the empty space above the head. The character is:`;

const CAST: Record<string, string> = {
  tout: "a loud tip-seller in a soft-green shirt shouting into a big brick-red megaphone held up to his mouth",
  bull: "a sly smiling broker in a charcoal suit and red tie wearing a brick-red bull mask pushed up on top of his head",
  bear: "a calm broker in a grey suit wearing a brown bear mask over his head, raising one fist, holding a tablet in the other hand",
  receipt: "a triumphant young woman in a lilac top holding a very long unrolled white paper receipt high above her head",
  chai: "a cheerful chai-wallah with a moustache in a brick-red shirt holding a round steel tray with three small glasses of chai",
  auntie: "a curious auntie in a lilac sari comparing two smartphones, one in each hand",
  nani: "a worried grandmother with grey hair in a bun and round glasses, in a soft-green sari, squinting at a folded newspaper stock page",
  nailbiter: "an anxious young man in a yellow polo shirt biting his nails while holding a phone showing a falling red zigzag chart",
  landline: "a bald uncle with round glasses in a brick-red sweater talking on an old corded landline telephone receiver",
  slips: "a gleeful young man in a soft-green shirt with both arms raised high, throwing paper tip-slips into the air",
  sardar: "a smiling sardar in an orange turban and soft-green kurta holding up a paper printout showing a rising green chart",
  student: "a college girl in a yellow t-shirt holding up a smartphone showing a rising green zigzag chart",
  clerk: "an office worker in a lilac shirt and charcoal tie looking down at his phone, raising his other hand",
  fist: "a confident young woman in a soft-green kurta raising a clenched fist and holding a phone with a red chart",
};

async function gen(name: string, desc: string) {
  const out = `public/cast/${name}.png`;
  if (existsSync(out) && !only) return console.log(name, "exists");
  const fd = new FormData();
  fd.append("model", "gpt-image-1");
  fd.append("image[]", new Blob([readFileSync(ref)], { type: "image/png" }), "ref.png");
  fd.append("prompt", `${FRAME} ${desc}.`);
  fd.append("size", "1024x1024");
  fd.append("quality", "high");
  fd.append("background", "transparent");
  fd.append("output_format", "png");
  fd.append("n", "1");
  const r = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: fd,
  });
  const d = await r.json();
  if (!r.ok) return console.log(name, "FAIL", d.error?.message?.slice(0, 160));
  writeFileSync(out, Buffer.from(d.data[0].b64_json, "base64"));
  console.log(name, "ok");
}

const jobs = Object.entries(CAST).filter(([n]) => !only || n === only);
for (let i = 0; i < jobs.length; i += 5) {
  await Promise.all(jobs.slice(i, i + 5).map(([n, d]) => gen(n, d)));
}
console.log("DONE");
