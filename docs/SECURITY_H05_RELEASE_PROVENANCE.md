# H-05 — Release provenance (frontend)

## Backend contract

`GET /api/version` returns deploy metadata (additive; no break for existing clients):

| Field | Meaning |
|-------|---------|
| `gitSha` | Git commit SHA of the deployed backend |
| `lockHash` | Hash of the lockfile used for that deploy |
| `stage` | Deploy stage / environment |
| `migrationVersion` | Applied DB migration version |
| `deployedAt` | Deploy timestamp |

## Frontend

Optional admin/dev build footer (`BuildProvenanceFooter`) calls that endpoint and shows a compact strip (sha, stage, migration, lock, deployed time).

**When it shows**

- Vite `import.meta.env.DEV`, or
- `VITE_SHOW_BUILD_FOOTER=true` (e.g. staging / ops admin builds)

Mounted on the Super Admin layout. Failure to fetch is silent (no UI, no app break).

## Ops (required)

1. Set the GitHub **default branch** to `main`.
2. **Protect** `main` (required reviews, no force-push, restrict who can push).

Without a protected default `main`, release provenance (`gitSha` / CI artifacts) cannot be trusted as the sole source of what production runs.
