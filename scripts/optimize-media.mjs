/**
 * M-05 media optimization — logos → WebP, hero poster, optional ffmpeg video variants.
 *
 * Usage:
 *   node scripts/optimize-media.mjs
 *   node scripts/optimize-media.mjs --video   # requires ffmpeg on PATH
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const assets = path.join(root, "public", "assets");

const wantVideo = process.argv.includes("--video");

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

async function toWebp(inputName, outputName, { width = 320, quality = 78 } = {}) {
  const input = path.join(assets, inputName);
  const output = path.join(assets, outputName);
  if (!fs.existsSync(input)) {
    console.warn(`skip missing ${inputName}`);
    return null;
  }
  await sharp(input)
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(output);
  const size = fs.statSync(output).size;
  console.log(`✓ ${outputName} (${kb(size)}) from ${inputName}`);
  if (size > 40 * 1024) {
    console.warn(`  warning: ${outputName} exceeds 40 KB budget`);
  }
  return size;
}

async function posterFromHero() {
  const candidates = ["hero.png", "herobgvideofinal.mp4"];
  const heroPng = path.join(assets, "hero.png");
  const out = path.join(assets, "hero-poster.webp");
  if (fs.existsSync(heroPng)) {
    await sharp(heroPng)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 72, effort: 6 })
      .toFile(out);
    console.log(`✓ hero-poster.webp (${kb(fs.statSync(out).size)}) from hero.png`);
    return;
  }
  console.warn(`skip poster — none of ${candidates.join(", ")} usable without ffmpeg frame grab`);
}

function hasFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

function encodeVideo(args, label) {
  console.log(`encoding ${label}…`);
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`ffmpeg failed for ${label}`);
    process.exitCode = 1;
  }
}

function optimizeVideos() {
  if (!hasFfmpeg()) {
    console.error("ffmpeg not on PATH — install ffmpeg, then re-run with --video");
    process.exitCode = 1;
    return;
  }
  const src = path.join(assets, "herobgvideofinal.mp4");
  if (!fs.existsSync(src)) {
    console.error("missing herobgvideofinal.mp4");
    process.exitCode = 1;
    return;
  }

  const mobileMp4 = path.join(assets, "hero-mobile.mp4");
  const mobileWebm = path.join(assets, "hero-mobile.webm");
  const desktopMp4 = path.join(assets, "hero-desktop.mp4");
  const desktopWebm = path.join(assets, "hero-desktop.webm");
  const posterJpg = path.join(assets, "hero-poster-frame.jpg");

  encodeVideo(
    [
      "-y",
      "-i",
      src,
      "-ss",
      "0.5",
      "-vframes",
      "1",
      "-q:v",
      "3",
      posterJpg,
    ],
    "poster frame",
  );

  encodeVideo(
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=720:-2",
      "-c:v",
      "libx264",
      "-profile:v",
      "main",
      "-crf",
      "28",
      "-preset",
      "medium",
      "-an",
      "-movflags",
      "+faststart",
      mobileMp4,
    ],
    "hero-mobile.mp4",
  );

  encodeVideo(
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=720:-2",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "36",
      "-an",
      mobileWebm,
    ],
    "hero-mobile.webm",
  );

  encodeVideo(
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=1280:-2",
      "-c:v",
      "libx264",
      "-crf",
      "26",
      "-preset",
      "medium",
      "-an",
      "-movflags",
      "+faststart",
      desktopMp4,
    ],
    "hero-desktop.mp4",
  );

  encodeVideo(
    [
      "-y",
      "-i",
      src,
      "-vf",
      "scale=1280:-2",
      "-c:v",
      "libvpx-vp9",
      "-b:v",
      "0",
      "-crf",
      "34",
      "-an",
      desktopWebm,
    ],
    "hero-desktop.webm",
  );

  for (const f of [mobileMp4, mobileWebm, desktopMp4, desktopWebm]) {
    if (fs.existsSync(f)) {
      console.log(`  ${path.basename(f)}: ${kb(fs.statSync(f).size)}`);
    }
  }
}

async function main() {
  await toWebp("logo.png", "logo.webp", { width: 280, quality: 80 });
  await toWebp("logoblack.png", "logoblack.webp", { width: 280, quality: 80 });
  await toWebp("logowhite.png", "logowhite.webp", { width: 280, quality: 80 });
  await posterFromHero();

  if (wantVideo) {
    optimizeVideos();
    const frame = path.join(assets, "hero-poster-frame.jpg");
    if (fs.existsSync(frame)) {
      await sharp(frame)
        .resize({ width: 960, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(path.join(assets, "hero-poster.webp"));
      console.log("✓ hero-poster.webp refreshed from video frame");
    }
  } else {
    console.log("Tip: run with --video when ffmpeg is available to build ≤1.5 MB mobile variants.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
