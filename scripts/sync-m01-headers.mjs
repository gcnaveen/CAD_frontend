#!/usr/bin/env node
/**
 * M-01 — regenerate Netlify `_headers`, CloudFront policy, and netlify.toml
 * CSP mirror from security/m01-headers.json.
 *
 *   npm run sync:headers
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const headers = JSON.parse(
  readFileSync(join(root, "security", "m01-headers.json"), "utf8")
);

const lines = ["/*"];
for (const [name, value] of Object.entries(headers)) {
  lines.push(`  ${name}: ${value}`);
}
lines.push("");
writeFileSync(join(root, "public", "_headers"), lines.join("\n"), "utf8");

const cloudfrontPath = join(root, "security", "cloudfront-m01-response-headers-policy.json");
const policy = JSON.parse(readFileSync(cloudfrontPath, "utf8"));
policy.SecurityHeadersConfig.ContentSecurityPolicy.ContentSecurityPolicy =
  headers["Content-Security-Policy"];
policy.SecurityHeadersConfig.ReferrerPolicy.ReferrerPolicy =
  headers["Referrer-Policy"];
policy.SecurityHeadersConfig.FrameOptions.FrameOption =
  headers["X-Frame-Options"];
const perm = policy.CustomHeadersConfig.Items.find(
  (i) => i.Header === "Permissions-Policy"
);
if (perm) perm.Value = headers["Permissions-Policy"];
writeFileSync(cloudfrontPath, `${JSON.stringify(policy, null, 2)}\n`, "utf8");

const netlifyPath = join(root, "netlify.toml");
const csp = headers["Content-Security-Policy"].replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const netlify = `# SPA fallback
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# M-01 — HTML site security headers (do not rely on API CSP for the React document)
# Canonical values: security/m01-headers.json — regenerate with: npm run sync:headers
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "${csp}"
    X-Content-Type-Options = "${headers["X-Content-Type-Options"]}"
    Referrer-Policy = "${headers["Referrer-Policy"]}"
    Permissions-Policy = "${headers["Permissions-Policy"]}"
    X-Frame-Options = "${headers["X-Frame-Options"]}"
    Strict-Transport-Security = "${headers["Strict-Transport-Security"]}"
`;
writeFileSync(netlifyPath, netlify, "utf8");

console.log("Synced M-01 headers → public/_headers, netlify.toml, cloudfront policy");
