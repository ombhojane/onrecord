// Generates custom artwork via OpenAI gpt-image-1. Key stays in the env file; never logged.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = readFileSync("/Users/omi/products/resources/.env", "utf8");
const key = env.match(/^openai=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("no openai key found");
mkdirSync("public/art", { recursive: true });

const SCENE = `two dozen small characters crowding along the bottom edge: a tout standing on a wooden crate shouting into a megaphone, men in kurtas and office shirts staring down at smartphones, a seated broker at a tiny desk handing out paper tip-slips, two friends arguing over a paper chart, a skeptical woman holding a receipt up to the light, a pickpocket lifting rupee notes from a jacket pocket, a sly salesman in a suit with a bull mask pushed up on his head, scattered paper slips and a toppled chai glass on the ground`;

const JOBS: Record<string, string> = {
  frieze_white: `A horizontal crowd frieze drawn as a vintage 3-colour risograph screen print (brick red, olive green, charcoal) on a completely plain pure white background with no gradient and no sky, depicting a modern Indian stock-market tip bazaar: ${SCENE}. Chunky textured print grain, slight colour misregistration, flat shapes, hand-drawn linework. All figures stand on the very bottom edge of the image forming one continuous band occupying only the lower half; the entire upper half is untouched pure white. No text, no borders, no watermark.`,
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
