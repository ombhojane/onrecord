// Generates custom artwork via OpenAI gpt-image-1. Key stays in the env file; never logged.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = readFileSync("/Users/omi/products/resources/.env", "utf8");
const key = env.match(/^openai=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("no openai key found");
mkdirSync("public/art", { recursive: true });

const SCENE = `two dozen small characters crowding along the bottom edge: a tout standing on a wooden crate shouting into a megaphone, men in kurtas and office shirts staring down at smartphones, a seated broker at a tiny desk handing out paper tip-slips, two friends arguing over a paper chart, a skeptical woman holding a receipt up to the light, a pickpocket lifting rupee notes from a jacket pocket, a sly salesman in a suit with a bull mask pushed up on his head, scattered paper slips and a toppled chai glass on the ground`;

const JOBS: Record<string, string> = {
  crowd_wide2: `A very wide hero illustration in a modern flat vector sticker style with uniform thin charcoal outlines around every shape, minimal dot-and-line faces, flat fills, no gradients, no texture, on a completely pure white background. A continuous unbroken row of at least sixteen different Indian stock-market characters fills the ENTIRE width of the image from the far left edge to the far right edge with no gaps anywhere: the figures touching the left and right borders are cut off mid-body by the image edge, so the crowd feels like it continues beyond the frame. Characters include: a chai-wallah balancing a tray of small glasses while reading a tip on his phone, an auntie in a sari comparing two phones held side by side, a young man garlanding his smartphone with a marigold mala like a shrine, a grandmother squinting at a newspaper stock page, a college boy with binoculars looking upward, a man biting his nails watching a red chart, a woman triumphantly waving a long paper receipt overhead, a bear-mask man in a grey suit checking his watch, raised hands with phones and paper slips. Everyone is cropped at the chest or waist by the bottom border of the image. Strict limited palette: charcoal #17140F, brick red #E2412E, warm yellow #FFE45C, soft green #9FD9AE, lilac #CDBBF5, plus white. The crowd band occupies only the bottom third of the image; the upper two thirds are completely empty pure white. No text, no logos, no watermark.`,
};

async function gen(name: string, prompt: string) {
  const r = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1536x1024",
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });
  const d = await r.json();
  if (!r.ok) {
    console.log(name, "FAIL", d.error?.message?.slice(0, 200));
    return;
  }
  const b64 = d.data?.[0]?.b64_json;
  writeFileSync(`public/art/${name}.png`, Buffer.from(b64, "base64"));
  console.log(name, "ok", Math.round(Buffer.from(b64, "base64").length / 1024) + "KB");
}

await Promise.all(Object.entries(JOBS).map(([n, p]) => gen(n, p)));
