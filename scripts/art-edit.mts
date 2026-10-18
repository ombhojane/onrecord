// Continues panel 1 with matched style via the images/edits endpoint.
import { readFileSync, writeFileSync } from "node:fs";

const env = readFileSync("/Users/omi/products/resources/.env", "utf8");
const key = env.match(/^openai=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("no key");

const srcPath = process.argv[2];
const outPath = process.argv[3];
const img = new Blob([readFileSync(srcPath)], { type: "image/png" });

const prompt = `Create a companion illustration that seamlessly continues this exact crowd scene to the right, as if it were the right half of the same wide panorama. Match EXACTLY: the same flat vector sticker style, the same thin charcoal outline weight, the same colour palette (charcoal #17140F, brick red #E2412E, warm yellow #FFE45C, soft green #9FD9AE, lilac #CDBBF5, white), the same character scale and proportions, heads reaching the same height as in the reference, everyone cropped at the chest or waist by the bottom border, the crowd band occupying only the bottom third, the upper two thirds completely empty pure white background. NEW different Indian stock-market characters, no repeats from the reference: a chai-wallah balancing a tray of chai glasses while reading his phone, an auntie in a sari comparing two phones, a grandmother squinting at a newspaper stock page, a man biting his nails at a falling red chart, a woman triumphantly waving a long paper receipt overhead, a bear-mask man in a grey suit (counterpart to the bull mask), raised hands holding phones and paper slips. Figures at the far left and far right edges are cut off mid-body by the image border. No text, no watermark.`;

const fd = new FormData();
fd.append("model", "gpt-image-1");
fd.append("image[]", img, "ref.png");
fd.append("prompt", prompt);
fd.append("size", "1536x1024");
fd.append("quality", "high");
fd.append("n", "1");

const r = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { authorization: `Bearer ${key}` },
  body: fd,
});
const d = await r.json();
if (!r.ok) {
  console.log("FAIL", d.error?.message?.slice(0, 300));
  process.exit(1);
}
writeFileSync(outPath, Buffer.from(d.data[0].b64_json, "base64"));
console.log("wrote", outPath);
