/**
 * Generates optimized BICA logo assets in public/brand/.
 * Source: logo Base de ingredientes.png (project root) or public/brand/source/bica-logo-source.png
 */
import sharp from "sharp";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const sourceCandidates = [
  join(root, "logo Base de ingredientes.png"),
  join(root, "public/brand/source/bica-logo-source.png"),
];
const src = sourceCandidates.find((p) => existsSync(p));

if (!src) {
  console.error("Logo source not found. Place PNG at project root or public/brand/source/");
  process.exit(1);
}

const outDir = join(root, "public/brand");
const sourceDir = join(outDir, "source");
mkdirSync(outDir, { recursive: true });
mkdirSync(sourceDir, { recursive: true });

if (src !== join(sourceDir, "bica-logo-source.png")) {
  copyFileSync(src, join(sourceDir, "bica-logo-source.png"));
}

const source = join(sourceDir, "bica-logo-source.png");
const markExtract = { left: 0, top: 0, width: 300, height: 358 };

await sharp(source).resize({ width: 540 }).webp({ quality: 88, effort: 6 }).toFile(join(outDir, "bica-logo.webp"));
await sharp(source).resize({ width: 540 }).png({ compressionLevel: 9 }).toFile(join(outDir, "bica-logo.png"));
await sharp(source).resize({ width: 1080 }).webp({ quality: 90, effort: 6 }).toFile(join(outDir, "bica-logo@2x.webp"));

for (const [size, name] of [
  [256, "bica-mark.webp"],
  [256, "bica-mark.png"],
  [180, "apple-touch-icon.png"],
  [32, "favicon-32.png"],
  [192, "icon-192.png"],
  [512, "icon-512.png"],
]) {
  const pipeline = sharp(source)
    .extract(markExtract)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

  if (name.endsWith(".webp")) {
    await pipeline.webp({ quality: 88 }).toFile(join(outDir, name));
  } else {
    await pipeline.png({ compressionLevel: 9 }).toFile(join(outDir, name));
  }
}

console.log("Brand assets written to public/brand/");

// Eternia — Powered by logo
const eterniaCandidates = [
  join(root, "eternia-logo.png"),
  join(sourceDir, "eternia-logo-source.png"),
];
const eterniaSrc = eterniaCandidates.find((p) => existsSync(p));

if (eterniaSrc) {
  if (eterniaSrc !== join(sourceDir, "eternia-logo-source.png")) {
    copyFileSync(eterniaSrc, join(sourceDir, "eternia-logo-source.png"));
  }
  const eternia = join(sourceDir, "eternia-logo-source.png");
  const eterniaBase = sharp(eternia).trim({ threshold: 12 });
  await eterniaBase.clone().resize(240).webp({ quality: 88 }).toFile(join(outDir, "eternia-logo.webp"));
  await eterniaBase.clone().resize(240).png({ compressionLevel: 9 }).toFile(join(outDir, "eternia-logo.png"));
  await eterniaBase.clone().resize(480).webp({ quality: 90 }).toFile(join(outDir, "eternia-logo@2x.webp"));
  console.log("Eternia assets written.");
}
