/**
 * M-05: fail CI when initial (entry + sync shared) JS gzip exceeds budget,
 * unless a documented exception exists and is unexpired.
 *
 * Counts: index.html module script + modulepreload links that are statically
 * imported by the entry (not dynamic import() targets).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const exceptionPath = path.join(
  root,
  "docs",
  "PERFORMANCE_M05_BUDGET_EXCEPTIONS.json",
);

const BUDGET_GZIP_KB = 250;

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function loadException() {
  if (!fs.existsSync(exceptionPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(exceptionPath, "utf8"));
  } catch {
    return null;
  }
}

function exceptionAllows(measuredKb) {
  const doc = loadException();
  if (!doc?.exceptions?.length) return false;
  const today = new Date().toISOString().slice(0, 10);
  return doc.exceptions.some((ex) => {
    if (ex.metric !== "initial_js_gzip_kb") return false;
    if (ex.expires && ex.expires < today) return false;
    return measuredKb <= (ex.ceiling_kb ?? Infinity);
  });
}

function collectStaticImports(entryCode, assetsDir) {
  const found = new Set();
  const queue = [];
  for (const m of entryCode.matchAll(/from\s*["']\.\/([^"']+)["']/g)) {
    queue.push(m[1]);
  }
  // Side-effect imports
  for (const m of entryCode.matchAll(/import\s*["']\.\/([^"']+)["']/g)) {
    queue.push(m[1]);
  }

  while (queue.length) {
    const name = queue.pop();
    if (found.has(name)) continue;
    found.add(name);
    const file = path.join(assetsDir, name);
    if (!fs.existsSync(file) || !name.endsWith(".js")) continue;
    const code = fs.readFileSync(file, "utf8");
    for (const m of code.matchAll(/from\s*["']\.\/([^"']+)["']/g)) {
      queue.push(m[1]);
    }
    for (const m of code.matchAll(/import\s*["']\.\/([^"']+)["']/g)) {
      queue.push(m[1]);
    }
  }
  return found;
}

function main() {
  if (!fs.existsSync(dist)) {
    console.error("dist/ missing — run npm run build first");
    process.exit(1);
  }

  const htmlPath = path.join(dist, "index.html");
  const html = fs.readFileSync(htmlPath, "utf8");
  const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="(\/assets\/[^"]+\.js)"/);
  if (!entryMatch) {
    console.error("Could not find entry module script in dist/index.html");
    process.exit(1);
  }

  const entryRel = entryMatch[1];
  const entryFile = path.join(dist, entryRel.replace(/^\//, ""));
  const entryCode = fs.readFileSync(entryFile, "utf8");
  const assetsDir = path.join(dist, "assets");

  const staticNames = collectStaticImports(entryCode, assetsDir);
  const files = [entryRel, ...[...staticNames].map((n) => `/assets/${n}`)];

  let total = 0;
  const rows = [];
  for (const rel of [...new Set(files)]) {
    const file = path.join(dist, rel.replace(/^\//, ""));
    if (!fs.existsSync(file) || !rel.endsWith(".js")) continue;
    const gz = gzipSize(fs.readFileSync(file));
    total += gz;
    rows.push({ rel, gzipKb: gz / 1024 });
  }

  const measuredKb = total / 1024;
  console.log("Initial JS (entry + static import graph) gzip:");
  for (const r of rows.sort((a, b) => b.gzipKb - a.gzipKb)) {
    console.log(`  ${r.gzipKb.toFixed(1)} KB  ${r.rel}`);
  }
  console.log(`Total: ${measuredKb.toFixed(1)} KB (budget ${BUDGET_GZIP_KB} KB)`);

  const report = {
    metric: "initial_js_gzip_kb",
    budget_kb: BUDGET_GZIP_KB,
    measured_kb: Number(measuredKb.toFixed(1)),
    files: rows,
    at: new Date().toISOString(),
  };
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs", "PERFORMANCE_M05_LAST_MEASUREMENT.json"),
    JSON.stringify(report, null, 2),
  );

  if (measuredKb <= BUDGET_GZIP_KB) {
    console.log("PASS — within budget");
    return;
  }

  if (exceptionAllows(measuredKb)) {
    console.warn(
      "WARN — over budget but covered by docs/PERFORMANCE_M05_BUDGET_EXCEPTIONS.json",
    );
    return;
  }

  console.error(
    "FAIL — initial JS gzip over budget. Reduce critical path or file an exception (product owner).",
  );
  process.exit(1);
}

main();
