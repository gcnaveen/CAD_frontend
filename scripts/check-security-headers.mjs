#!/usr/bin/env node
/**
 * M-01 — verify HTML-site security headers on a deployed (or preview) origin.
 *
 * Usage:
 *   node scripts/check-security-headers.mjs
 *   node scripts/check-security-headers.mjs https://app.yourdomain.com
 *   SECURITY_HEADERS_URL=https://app.yourdomain.com npm run check:headers
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const expected = JSON.parse(
  readFileSync(join(__dirname, "..", "security", "m01-headers.json"), "utf8")
);

const url = process.argv[2] || process.env.SECURITY_HEADERS_URL || "http://127.0.0.1:4173/";

const REQUIRED = [
  "content-security-policy",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
  "strict-transport-security",
];

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function headerGet(headers, name) {
  if (typeof headers.get === "function") return headers.get(name);
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (String(k).toLowerCase() === lower) return v;
  }
  return null;
}

const res = await fetch(url, { redirect: "manual" });
const missing = [];
const mismatches = [];

for (const name of REQUIRED) {
  const actual = headerGet(res.headers, name);
  if (!actual) {
    missing.push(name);
    continue;
  }

  const expectKey = Object.keys(expected).find((k) => k.toLowerCase() === name);
  if (!expectKey) continue;

  // HSTS may already be set by the CDN with equivalent values — only require presence + max-age.
  if (name === "strict-transport-security") {
    if (!/max-age=\d+/i.test(actual)) {
      mismatches.push(`${name}: missing max-age (got ${actual})`);
    }
    continue;
  }

  if (name === "content-security-policy") {
    const need = ["frame-ancestors 'none'", "object-src 'none'", "script-src"];
    for (const token of need) {
      if (!normalize(actual).includes(normalize(token))) {
        mismatches.push(`${name}: missing directive/token "${token}"`);
      }
    }
    continue;
  }

  if (normalize(actual) !== normalize(expected[expectKey])) {
    mismatches.push(`${name}: expected "${expected[expectKey]}", got "${actual}"`);
  }
}

if (missing.length || mismatches.length) {
  console.error(`M-01 header check FAILED for ${url}`);
  if (missing.length) console.error("  missing:", missing.join(", "));
  for (const m of mismatches) console.error("  ", m);
  process.exitCode = 1;
} else {
  console.log(`M-01 header check OK for ${url}`);
  for (const name of REQUIRED) {
    console.log(`  ${name}: ${headerGet(res.headers, name)}`);
  }
}
