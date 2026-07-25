# L-01 — PWA, SEO, and brand metadata

## What changed

| Surface | Before | After |
|--------|--------|--------|
| PWA `name` / `short_name` | Admin Panel / Admin | North-cot (+ full product name) |
| Theme / background | `#0ea5e9` / `#f8fafc` | `#152815` / `#0d1f0d` (brand green) |
| Icons | Blue “A” placeholders | Logo on brand-green squares (`pwa-192`, `pwa-512`, maskable) |
| HTML title | North Cot CAD | North-cot — Land Survey & CAD Documentation |
| Meta description / OG / Twitter | Missing | Present in `index.html` + kept in sync by `DocumentMeta` |
| Favicon / share image | Broken logo link as favicon | `favicon.ico`, 16/32 PNGs, apple-touch-icon, `og-image.png` |

Source of truth for copy/colors: `src/constants/siteMeta.js`.

## Absolute URLs

Set production origin in env (no trailing slash):

```bash
VITE_SITE_URL=https://northcot.in
```

Used for canonical / Open Graph when the SPA is running. Static defaults in `index.html`, `robots.txt`, and `sitemap.xml` also use `https://northcot.in` — update those three files if the live host differs.

## Indexing strategy (private app routes)

**Index (Allow):** `/`, `/login`, `/login-email`, `/register`, `/register/cad-operator`, `/privacy-policy`, `/terms-and-conditions`.

**Do not index (Disallow + `noindex,nofollow`):**

- `/dashboard/*` (surveyor + CAD shells)
- `/superadmin/*`, `/admin/*`
- `/complete-profile`, `/profile`
- `/payment*`, `/cad/*`, `/surveyor/*`, `/403`

Enforcement layers:

1. `public/robots.txt` — crawler Disallow for private prefixes  
2. `DocumentMeta` — `robots` / `googlebot` meta `noindex,nofollow` on those paths  
3. Auth (`ProtectedRoute`) — empty shells without a session (content not publicly useful)

Rationale: this is an authenticated product SPA. Search should surface the marketing/auth entry points only; dashboards and payment return URLs must not appear as search results.

## Acceptance checks

1. Build or run preview → Application → Manifest shows **North-cot**, theme `#152815`, branded icons.  
2. View page source / social debugger → title, description, `og:image` = `/og-image.png`.  
3. Navigate to `/dashboard/user` (logged in) → `document` robots = `noindex, nofollow`.  
4. `/robots.txt` Disallow list matches private prefixes; sitemap lists public URLs only.
