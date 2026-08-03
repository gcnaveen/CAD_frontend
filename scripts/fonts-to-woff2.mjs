/**
 * Convert the four @font-face TTFs used by index.css into WOFF2.
 *
 * TTF has no compression; WOFF2 (Brotli) typically lands around 30% of the
 * original, which directly cuts render-blocking font weight on first paint.
 *
 * Usage:
 *   node scripts/fonts-to-woff2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compress } from "wawoff2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fontsDir = path.join(root, "src", "assets", "fonts");

// Only the weights actually declared in src/index.css.
const TARGETS = [
  "ibm/IBMPlexSans-Regular.ttf",
  "ibm/IBMPlexSans-SemiBold.ttf",
  "montserrat/Montserrat-Regular.ttf",
  "montserrat/Montserrat-SemiBold.ttf",
];

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

async function main() {
  let before = 0;
  let after = 0;

  for (const rel of TARGETS) {
    const input = path.join(fontsDir, rel);
    if (!fs.existsSync(input)) {
      console.warn(`skip missing ${rel}`);
      continue;
    }
    const output = input.replace(/\.ttf$/i, ".woff2");
    const ttf = fs.readFileSync(input);
    const woff2 = Buffer.from(await compress(ttf));
    fs.writeFileSync(output, woff2);

    before += ttf.length;
    after += woff2.length;
    const pct = ((1 - woff2.length / ttf.length) * 100).toFixed(1);
    console.log(
      `✓ ${path.basename(output)} ${kb(ttf.length)} → ${kb(woff2.length)} (-${pct}%)`,
    );
  }

  console.log(
    `\nTotal: ${kb(before)} → ${kb(after)} (saved ${kb(before - after)})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
