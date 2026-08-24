/**
 * M-04 repository hygiene gate:
 * - No deployment archives / large binaries in the tree
 * - No unused backup modules under src/
 * - No default-password / secret-looking literals in app source
 * - Soft size budget for tracked source files
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const MAX_FILE_BYTES = 1_500_000; // 1.5 MB
const ARCHIVE_RE = /\.(zip|7z|rar|tar|gz|tgz|iso)$/i;
const SOURCE_RE = /\.(js|jsx|ts|tsx|mjs|cjs|json|yml|yaml|md|html|css)$/i;

const SKIP_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  "dist",
  "dev-dist",
  "coverage",
  "playwright-report",
  "test-results",
  "blob-report",
  ".cursor",
]);

const SECRET_PATTERNS = [
  {
    id: "private-key",
    re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    id: "aws-access-key",
    re: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: "generic-api-key-assignment",
    re: /\b(?:api[_-]?key|secret[_-]?key|auth[_-]?token)\s*[:=]\s*['"][^'"]{16,}['"]/i,
  },
  {
    id: "jwt-secret-constant",
    // L-03: no frontend JWT / signing secrets (see check-l03-frontend-secrets.mjs).
    re: /\b(?:JWT_SECRET|AUTH_SECRET|SESSION_SECRET|SIGNING_SECRET)\b/,
  },
  {
    id: "default-password-literal",
    re: /\b(?:defaultPassword|DEFAULT_PASSWORD|tempPassword\s*=\s*['"](?:1234|0000|password|admin)['"])/i,
  },
  {
    id: "hardcoded-operator-pin",
    re: /\bpassword\s*:\s*['"](?:1234|0000|1111|9999)['"]/,
  },
];

const FORBIDDEN_PATHS = [
  "src/_backup_unused",
  "src\\_backup_unused",
];

function fail(message) {
  console.error(`M-04 FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`M-04 OK: ${message}`);
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function gitTrackedFiles() {
  const git = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
  });
  if (git.status !== 0) return null;
  const raw = git.stdout.toString("utf8");
  if (!raw) return [];
  return raw
    .split("\0")
    .filter(Boolean)
    .map((p) => join(root, p));
}

const files = gitTrackedFiles() ?? walk(root);
const rel = (abs) => relative(root, abs).split(sep).join("/");

let archiveHits = 0;
let oversized = 0;
let secretHits = 0;

for (const forbidden of FORBIDDEN_PATHS) {
  if (existsSync(join(root, forbidden))) {
    fail(`Forbidden backup path present: ${forbidden.replace(/\\/g, "/")}`);
  }
}

for (const file of files) {
  const pathRel = rel(file);
  if (!pathRel || pathRel.startsWith("..")) continue;
  if (!existsSync(file)) continue;

  if (ARCHIVE_RE.test(pathRel)) {
    fail(`Archive/binary must not be in the repository: ${pathRel}`);
    archiveHits += 1;
    continue;
  }

  let size = 0;
  try {
    size = statSync(file).size;
  } catch {
    continue;
  }

  // if (size > MAX_FILE_BYTES && !pathRel.startsWith("docs/sbom/") && !pathRel.startsWith("public/")) {
  //   fail(`File exceeds ${MAX_FILE_BYTES} bytes (${size}): ${pathRel}`);
  //   oversized += 1;
  // }
  if (
    size > MAX_FILE_BYTES &&
    !pathRel.startsWith("docs/sbom/") &&
    !pathRel.startsWith("public/") &&
    !pathRel.startsWith("media-src/")
  ) {
    fail(`File exceeds ${MAX_FILE_BYTES} bytes (${size}): ${pathRel}`);
    oversized += 1;
  }

  if (!SOURCE_RE.test(pathRel)) continue;
  if (pathRel.startsWith("docs/sbom/")) continue;
  if (pathRel.includes("package-lock.json")) continue;
  // Gate scripts embed detection regexes / sample identifiers (M-04 / L-03).
  if (/^scripts\/check-.*\.mjs$/.test(pathRel)) continue;

  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.re.test(text)) {
      fail(`Suspicious secret/default-password pattern (${pattern.id}) in ${pathRel}`);
      secretHits += 1;
    }
  }

  if (/DUMMY_[A-Z0-9_]+\s*=/.test(text) && pathRel.startsWith("src/")) {
    fail(`Dummy fixture constant found in production source: ${pathRel}`);
  }
}

if (process.exitCode) {
  console.error(
    `M-04 summary: archives=${archiveHits} oversized=${oversized} secrets=${secretHits}`,
  );
  process.exit(1);
}

pass("No archives, backup modules, oversized blobs, or default-password literals detected");
