import sharp from "sharp";
const src = process.argv[2] ?? "public/art/frieze_white.png";
const img = sharp(src);
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
// sample background from the top-left corner region
let r = 0, g = 0, b = 0, n = 0;
for (let y = 10; y < 60; y++)
  for (let x = 10; x < 60; x++) {
    const i = (y * info.width + x) * info.channels;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
r /= n; g /= n; b /= n;
console.log("bg", r.toFixed(1), g.toFixed(1), b.toFixed(1));
await sharp(src)
  .linear([255 / r, 255 / g, 255 / b], [0, 0, 0])
  .png()
  .toFile(process.argv[3] ?? "public/art/frieze.png");
console.log("wrote", process.argv[3]);
