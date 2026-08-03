import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".lighthouse");
fs.mkdirSync(outDir, { recursive: true });
const ud = path.join(outDir, "ud");
fs.mkdirSync(ud, { recursive: true });

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const chromePath = chromium.executablePath();

const outPath = path.join(outDir, "mobile-final");
const args = [
  "lighthouse",
  "http://127.0.0.1:4173/",
  "--only-categories=performance,accessibility,best-practices,seo",
  "--form-factor=mobile",
  "--screenEmulation.mobile=true",
  "--throttling-method=simulate",
  "--output=json",
  `--output-path=${outPath}`,
  `--chrome-path=${chromePath}`,
  `--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --user-data-dir=${ud}`,
  "--quiet",
];

const r = spawnSync("npx", ["--yes", ...args], {
  cwd: root,
  shell: true,
  encoding: "utf8",
  timeout: 180000,
});
process.stdout.write(r.stdout || "");
process.stderr.write(r.stderr || "");

const reportFile = `${outPath}.report.json`;
if (!fs.existsSync(reportFile)) {
  console.error("NO_REPORT exit", r.status);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const cats = report.categories;
const a = report.audits;
const score = (k) => Math.round((cats[k]?.score ?? 0) * 100);

const summary = {
  performance: score("performance"),
  accessibility: score("accessibility"),
  bestPractices: score("best-practices"),
  seo: score("seo"),
  fcp: a["first-contentful-paint"]?.displayValue,
  lcp: a["largest-contentful-paint"]?.displayValue,
  tbt: a["total-blocking-time"]?.displayValue,
  cls: a["cumulative-layout-shift"]?.displayValue,
  si: a["speed-index"]?.displayValue,
  unusedJsBytes: a["unused-javascript"]?.details?.overallSavingsBytes,
  unusedJsItems: (a["unused-javascript"]?.details?.items || [])
    .slice(0, 10)
    .map((i) => ({
      url: String(i.url || "").split("/").pop(),
      wasted: i.wastedBytes,
    })),
  renderBlockMs: a["render-blocking-resources"]?.details?.overallSavingsMs,
  modernImgBytes: a["modern-image-formats"]?.details?.overallSavingsBytes,
  respImgBytes: a["uses-responsive-images"]?.details?.overallSavingsBytes,
  optImgBytes: a["uses-optimized-images"]?.details?.overallSavingsBytes,
  antdFetched: (a["network-requests"]?.details?.items || [])
    .filter((i) => /\/es-/.test(String(i.url)))
    .map((i) => String(i.url).split("/").pop()),
  mainThread: a["mainthread-work-breakdown"]?.displayValue,
  longTasks: a["long-tasks"]?.details?.items?.length,
  nonComposited: a["non-composited-animations"]?.details?.items?.length,
  lcpOpportunity: a["priority-hints"]?.score,
};
console.log(JSON.stringify(summary, null, 2));
