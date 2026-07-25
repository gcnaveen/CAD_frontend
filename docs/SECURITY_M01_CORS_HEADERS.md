# M-01 — CORS & security headers (frontend / DevOps)

## Split of ownership

| Surface | Owner | What to configure |
|---------|--------|-------------------|
| API (JSON / preflight) | **Backend** | `CORS_ALLOW_ORIGINS` (or current env name — see below), API response security headers |
| HTML / React document | **This repo + CDN** | CSP and companion headers on CloudFront / Netlify / static host |

Do **not** rely on the API’s CSP for the React app document. Configure headers on the static host.

---

## API — CORS (backend / ops)

Before production deploy, set explicit browser origins (never `*`):

```bash
# Preferred (comma-separated allow-list). Backend may still use singular CORS_ALLOW_ORIGIN —
# set whatever the deployed API actually reads; values must be exact origins (scheme + host [+ port]).
CORS_ALLOW_ORIGINS=https://app.yourdomain.com,https://www.yourdomain.com
```

Checklist:

- [ ] Prod list includes **every** browser origin that calls the API
- [ ] **Localhost removed** from the prod list
- [ ] Preflight from an **unlisted** origin fails
- [ ] Preflight / credentialed calls from the **app origin** succeed

### Quick CORS probes (replace hosts)

```bash
# Must fail (no / wrong ACAO for unlisted origin)
curl -si -X OPTIONS "https://API_HOST/api/auth/login" \
  -H "Origin: https://evil.example" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" | head -n 30

# Must succeed for your real app origin
curl -si -X OPTIONS "https://API_HOST/api/auth/login" \
  -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" | head -n 30
```

API JSON responses should also send `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, and a restrictive CSP with `frame-ancestors 'none'` (backend-owned).

S3 bucket CORS for presigned PUTs is separate — see backend `s3-cors.example.json`. Prod bucket origins must match the same app hosts (no `*`).

---

## Website — security headers (this repo)

Canonical values live in [`security/m01-headers.json`](../security/m01-headers.json).

| Header | Role |
|--------|------|
| `Content-Security-Policy` | App policy; `script-src 'self'` (no inline scripts — theme boot is `/theme-init.js`); `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Disables unused camera/mic/geo/payment/sensors |
| `X-Frame-Options` | `DENY` (defense in depth with CSP) |
| `Strict-Transport-Security` | Keep / reinforce (audit already saw HSTS) |

### Where they are wired

| Host | File |
|------|------|
| Netlify | [`netlify.toml`](../netlify.toml) `[[headers]]` + [`public/_headers`](../public/_headers) |
| CloudFront | Create a **Response headers policy** from [`security/cloudfront-m01-response-headers-policy.json`](../security/cloudfront-m01-response-headers-policy.json) and attach it to the app distribution behavior |
| Local prod preview | Vite `preview.headers` reads `security/m01-headers.json` |

Edit **only** [`security/m01-headers.json`](../security/m01-headers.json), then run `npm run sync:headers` to refresh Netlify / `_headers` / CloudFront mirrors.


### CSP notes

- **Scripts:** Vite bundles + `/theme-init.js` + PWA `registerSW.js` are same-origin (`script-src 'self'`). Prefer hashes/nonces only if you reintroduce inline scripts (Lambda@Edge nonce injection is optional later).
- **Styles:** `'unsafe-inline'` is required for Ant Design runtime styles.
- **`connect-src`:** Defaults assume API Gateway / S3 in `ap-south-1`. If the API region or custom domain changes, update `security/m01-headers.json`, then mirror into Netlify / CloudFront configs.
- **PhonePe:** Checkout is a top-level navigation; `form-action` allow-lists PhonePe hosts.

---

## FE verification checklist

- [ ] Prod `CORS_ALLOW_ORIGINS` includes every browser origin that calls the API
- [ ] Localhost removed from prod CORS list
- [ ] App still loads after a header scan (`npm run build && npm run preview`, then `npm run check:headers`)
- [ ] Unapproved origin cannot call the API from a browser (OPTIONS probe above)
- [ ] Deployed site returns the M-01 headers: `npm run check:headers -- https://app.yourdomain.com`

```bash
npm run build
npm run preview   # separate terminal
npm run check:headers
```
