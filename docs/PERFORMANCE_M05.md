# M-05 — Frontend performance budgets (JS + media)

## Targets

| Metric | Target |
|--------|--------|
| LCP (mobile p75) | ≤ 2.5 s |
| INP (p75) | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Initial JS (gzip, critical path) | ≤ 250 KB |

## What shipped

- **Route shells:** `SurveyorApp` / `CadApp` / `AdminApp` lazy-loaded; dashboards not on login/public critical path.
- **Ant Design:** CSS theme only on public pages; `AntdShellProvider` loads `antd` inside `ProtectedRoute`.
- **Homepage:** below-fold sections + hero video lazy; poster + `preload="metadata"`; skip autoplay on cellular/save-data/reduced-motion.
- **Logos:** WebP ≤ ~20 KB (`npm run optimize:media`).
- **Fonts:** IBM Plex Sans + Montserrat subset to weights 400/600; removed Google Fonts Nunito.
- **CI:** `npm run check:bundle`, `npm run build:analyze`, Lighthouse CI on homepage.

## Commands

```bash
npm run optimize:media          # logos + poster
npm run optimize:media -- --video   # needs ffmpeg — mobile/desktop WebM/MP4
npm run test:m05                # build + bundle budget
npm run build:analyze           # dist/stats.html
npm run lighthouse:ci           # after build; starts preview
```

## Exception process

If initial JS exceeds 250 KB gzip, add an entry to `PERFORMANCE_M05_BUDGET_EXCEPTIONS.json` with measured size, reason, owner, and expiry. Empty `exceptions` means hard fail in CI.
