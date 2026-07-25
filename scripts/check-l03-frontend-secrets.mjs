/**
 * L-03 / M-04 frontend secret + dead-code gate.
 * Scans committed source for secret-like literals, default passwords,
 * and production dummy fixtures. Optionally requires a built dist/ when
 * L03_REQUIRE_BUNDLE=1 (post-build CI step).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const requireBundle = String(process.env.L03_REQUIRE_BUNDLE || "") === "1";

const FORBIDDEN_BUNDLE_RE =
  /DUMMY_ORDERS|DUMMY_CURRENT_ORDERS|DUMMY_PROJECT_HISTORY|defaultPassword|DEFAULT_PASSWORD|generateTempPin/;

function fail(message) {
  console.error(`L-03 FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`L-03 OK: ${message}`);
}

function walkDistHits(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkDistHits(full, hits);
    else if (/\.(js|css|html)$/i.test(name) && !/\.map$/i.test(name)) {
      const text = readFileSync(full, "utf8");
      if (FORBIDDEN_BUNDLE_RE.test(text)) hits.push(full);
    }
  }
  return hits;
}

const hygiene = spawnSync(process.execPath, [join(root, "scripts", "check-repo-hygiene.mjs")], {
  cwd: root,
  encoding: "utf8",
  stdio: "inherit",
});

if (hygiene.status !== 0) {
  fail("Repository hygiene / secret scan failed");
}

pass("Hygiene + secret patterns clean");

if (requireBundle) {
  const distIndex = join(root, "dist", "index.html");
  if (!existsSync(distIndex)) {
    fail("dist/ missing — run production build before L03_REQUIRE_BUNDLE=1");
  }

  const hits = walkDistHits(join(root, "dist"));
  if (hits.length) {
    fail(`Forbidden markers in production bundle:\n${hits.join("\n")}`);
  }

  pass("Production bundle has no dummy fixtures / default-password markers");
}

process.exit(0);
