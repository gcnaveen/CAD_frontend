import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const exceptionsPath = join(
  root,
  "docs",
  "SECURITY_H03_DEPENDENCY_EXCEPTIONS.json",
);

function fail(message) {
  console.error(`H-03 FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`H-03 OK: ${message}`);
}

function runNpm(args) {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(npmCmd, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

if (!existsSync(exceptionsPath)) {
  fail(`Missing exceptions register at ${exceptionsPath}`);
}

let exceptionsDoc;
try {
  exceptionsDoc = JSON.parse(readFileSync(exceptionsPath, "utf8"));
} catch (err) {
  fail(`Invalid JSON in exceptions register: ${err.message}`);
}

if (exceptionsDoc.schemaVersion !== 1) {
  fail("exceptions.schemaVersion must be 1");
}

const requiredExceptionFields = [
  "id",
  "packages",
  "severity",
  "cveOrAdvisory",
  "exploitability",
  "compensatingControl",
  "owner",
  "expiry",
  "status",
];

const today = new Date().toISOString().slice(0, 10);
const exceptions = Array.isArray(exceptionsDoc.exceptions)
  ? exceptionsDoc.exceptions
  : fail("exceptions.exceptions must be an array");

for (const ex of exceptions) {
  for (const field of requiredExceptionFields) {
    if (ex[field] == null || ex[field] === "") {
      fail(`Exception ${ex.id ?? "(missing id)"} missing field: ${field}`);
    }
  }
  if (!Array.isArray(ex.packages) || ex.packages.length === 0) {
    fail(`Exception ${ex.id} packages must be a non-empty array`);
  }
  if (ex.status === "accepted" && ex.expiry < today) {
    fail(`Exception ${ex.id} expired on ${ex.expiry}`);
  }
}

pass(
  `Exceptions register valid (${exceptions.length} entr${exceptions.length === 1 ? "y" : "ies"})`,
);

const audit = runNpm(["audit", "--omit=dev", "--audit-level=high", "--json"]);

let auditJson;
try {
  auditJson = JSON.parse(audit.stdout || "{}");
} catch {
  fail(`Could not parse npm audit JSON.\n${audit.stderr || audit.stdout}`);
}

const vulns = auditJson.metadata?.vulnerabilities ?? {};
const critical = vulns.critical ?? 0;
const high = vulns.high ?? 0;

if (critical > 0 || high > 0) {
  fail(
    `Production audit has ${critical} Critical and ${high} High (must be 0 / 0). Run: npm run audit:prod`,
  );
}

pass(
  `Production audit clean (critical=${critical}, high=${high}, moderate=${vulns.moderate ?? 0}, low=${vulns.low ?? 0})`,
);

console.log("H-03 acceptance gate passed.");
