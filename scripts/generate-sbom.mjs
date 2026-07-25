import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "docs", "sbom", "sbom-cyclonedx.json");

mkdirSync(dirname(outFile), { recursive: true });

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(
  npmCmd,
  ["sbom", "--omit=dev", "--sbom-format=cyclonedx", "--sbom-type=application"],
  { cwd: root, encoding: "utf8", shell: process.platform === "win32" },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "npm sbom failed");
  process.exit(result.status ?? 1);
}

if (!result.stdout) {
  console.error("npm sbom produced no stdout");
  process.exit(1);
}

writeFileSync(outFile, result.stdout);
console.log(`Wrote production SBOM to ${outFile}`);
