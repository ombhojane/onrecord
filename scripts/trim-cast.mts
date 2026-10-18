// Post-processes the cast so sprites stand on one floor line at one scale.
//  1. strips the white die-cut halo some sprites got (flood fill from the
//     transparent outside through near-white pixels; outlines stop the fill)
//  2. crops each sprite to its content bounds
//  3. resizes every sprite by the SAME factor, so head size stays uniform
//  4. writes lib/cast.json with each sprite's height in canvas units
import sharp from "sharp";
import { readdirSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";

const SRC = "public/cast/raw";
const OUT = "public/cast";
const SCALE = 0.6; // 1024 canvas -> 614px; identical for all sprites

mkdirSync(SRC, { recursive: true });
for (const f of readdirSync(OUT).filter((f) => f.endsWith(".png")))
  if (!existsSync(`${SRC}/${f}`)) copyFileSync(`${OUT}/${f}`, `${SRC}/${f}`);

const manifest: Record<string, { k: number; w: number; h: number }> = {};

// Sprites whose light clothing touches the canvas edge (the fill would erase it).
const NO_HALO = new Set<string>([]);
// Die-cut borders with a light-grey outer rim that stops a white-only fill.
const LOOSE = new Set(["bear", "clerk"]);

for (const f of readdirSync(SRC).filter((f) => f.endsWith(".png")).sort()) {
  const { data, info } = await sharp(`${SRC}/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, px = data;
  const at = (x: number, y: number) => (y * W + x) * 4;
  const name = f.replace(".png", "");
  const nearWhite = (i: number) => {
    if (px[i + 3] === 0) return false;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    if (r > 222 && g > 218 && b > 205) return true;
    if (!LOOSE.has(name)) return false;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return (r + g + b) / 3 > 150 && mx - mn < 28;
  };

  // 0. edge artifacts: the generator sometimes leaves a stray line on the canvas border.
  //    Clear the top/left/right margins; the bottom edge is the waist cut and stays.
  const M = 3;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (x < M || x >= W - M || y < M) px[at(x, y) + 3] = 0;

  // 1. halo removal: BFS from fully-transparent pixels into near-white neighbours
  const seen = new Uint8Array(W * H);
  const q: number[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (px[at(x, y) + 3] < 16) { seen[y * W + x] = 1; q.push(y * W + x); }
  let removed = 0;
  if (NO_HALO.has(name)) q.length = 0;
  while (q.length) {
    const p = q.pop()!;
    const x = p % W, y = (p - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (seen[n]) continue;
      seen[n] = 1;
      if (nearWhite(n * 4)) { px[n * 4 + 3] = 0; removed++; q.push(n); }
    }
  }

  // 2. content bounds
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (px[at(x, y) + 3] > 24) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const cw = maxX - minX + 1, ch = maxY - minY + 1;

  // 3. crop + uniform resize
  const tw = Math.round(cw * SCALE), th = Math.round(ch * SCALE);
  await sharp(px, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .resize(tw, th)
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${f}`);
  manifest[name] = { k: +(ch / H).toFixed(4), w: tw, h: th };
  console.log(name.padEnd(10), `halo -${removed}px`, `content ${cw}x${ch}`, `k=${(ch / H).toFixed(3)}`);
}

writeFileSync("lib/cast.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest → lib/cast.json");
