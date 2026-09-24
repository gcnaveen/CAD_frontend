# Backend: Surveyor Orders list — sort & date range

**Audience:** Backend team  
**Frontend consumer:** Surveyor / Public mobile **Requests** page (`GET /api/surveyor/orders`)  
**Date:** 2026-03-24  
**Priority:** Needed for correct pagination when filtering by date; frontend already sends these query params and falls back to client-side sort/filter on the loaded page (limit 50).

---

## Goal

1. Return orders **newest first** by default (`createdAt` descending).
2. Support **inclusive from–to date filtering** on `createdAt` so month / custom ranges work across all pages, not just the first 50 rows.

---

## Endpoint

```
GET /api/surveyor/orders
```

Auth: existing surveyor / public session (unchanged). Scope: only the authenticated user’s own orders (unchanged).

---

## Query parameters (additive)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `bucket` | `"all"` \| `"active"` \| `"completed"` \| `"cancelled"` | No | Existing. Used when listing “all” without a status list. |
| `status` | string (comma-separated statuses) | No | Existing. Overrides bucket when present. |
| `page` | number | No | Existing. Default `1`. |
| `limit` | number | No | Existing. Frontend Requests page uses `50`. |
| `sort` | `"createdAt"` | No | **New.** Field to sort by. Frontend sends `createdAt`. |
| `order` | `"asc"` \| `"desc"` | No | **New.** Frontend sends `desc` (newest first). |
| `from` | `YYYY-MM-DD` | No | **New.** Inclusive start calendar day (local or documented timezone — see below). |
| `to` | `YYYY-MM-DD` | No | **New.** Inclusive end calendar day. |

Existing params must keep working. Unknown/ignored params today should become supported as above without breaking callers that omit them.

### Default when `sort` / `order` omitted

Prefer:

```
sort = createdAt
order = desc
```

so Home / history callers also get newest-first without a frontend change.

---

## Date range semantics

- Filter field: **`createdAt`** (order / sketch-upload creation timestamp).
- `from` and `to` are **calendar dates** in `YYYY-MM-DD`.
- **Inclusive:**
  - `from=2026-03-01` → `createdAt >= 2026-03-01T00:00:00.000` (start of that day)
  - `to=2026-03-24` → `createdAt <= 2026-03-24T23:59:59.999` (end of that day)
- Either `from` or `to` alone is valid.
- If `from > to`, return `400` with a clear message (or swap — pick one and document; frontend constrains inputs so this should be rare).
- Invalid date strings → `400`.

### Timezone (please decide and document in the API response or wiki)

Frontend uses the user’s **local calendar day** for the date picker and for client-side fallback filtering.

**Recommended for India-first product:** interpret `from` / `to` in **Asia/Kolkata (IST)**.  
If the API uses UTC midnight instead, say so explicitly so the frontend can align.

---

## Example requests

**Newest first, all buckets (current Requests default):**

```
GET /api/surveyor/orders?bucket=all&page=1&limit=50&sort=createdAt&order=desc
```

**This month (example: March 2026 through today):**

```
GET /api/surveyor/orders?bucket=all&page=1&limit=50&sort=createdAt&order=desc&from=2026-03-01&to=2026-03-24
```

**Active tab + custom range:**

```
GET /api/surveyor/orders?status=PAYMENT_PENDING,PENDING,ASSIGNED,CAD_DELIVERED,UNDER_REVISION&page=1&limit=50&sort=createdAt&order=desc&from=2026-02-01&to=2026-02-28
```

---

## Response shape (unchanged envelope)

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "applicationId": "...",
      "status": "PENDING",
      "createdAt": "2026-03-15T14:30:00.000Z",
      "village": {},
      "hobli": {},
      "taluka": {},
      "district": {},
      "surveyType": "...",
      "surveyNo": "..."
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 50,
    "counts": {
      "all": 100,
      "active": 40,
      "completed": 50,
      "cancelled": 10
    }
  }
}
```

### Meta expectations with filters

| Field | Behavior with `from` / `to` |
|-------|-----------------------------|
| `meta.total` | Count of rows matching **status/bucket + date range**. |
| `data` | Page of matching rows, sorted as requested. |
| `meta.counts` | Prefer counts **for the same date range** (so tab badges match the filter). If that is costly, keep global counts and document that frontend tab badges ignore the date filter — frontend currently uses `meta.counts` / probe totals **without** date params for badge probes. |

**Frontend note:** Tab count probes currently omit `from`/`to`. Ideal follow-up: once date-scoped counts are cheap, frontend can pass the same range into count probes so badges stay consistent.

---

## Index / schema notes

No new collections required if `createdAt` already exists on the order / sketch-upload document.

Suggested compound indexes (adjust collection name to match yours):

```js
// Newest-first lists by owner
{ ownerId: 1, createdAt: -1 }

// Owner + status + date (status tab + range)
{ ownerId: 1, status: 1, createdAt: -1 }
```

If `ownerId` is named differently (`surveyorId`, `userId`, etc.), use that field.

Ensure `createdAt` is stored as a proper `Date` (or ISO string consistently parseable), not a display string.

---

## Acceptance criteria

1. Without `from`/`to`, list is sorted by `createdAt` **desc** when `sort=createdAt&order=desc` (or by default).
2. With `from`/`to`, only orders whose `createdAt` falls in the inclusive range are returned; pagination `meta.total` matches that filtered set.
3. Combining `status` or `bucket` with `from`/`to` applies **both** filters (AND).
4. Omitting the new params does not break existing clients.
5. Timezone rule for calendar days is documented (IST recommended).

---

## Frontend already sending

The React app (`getSurveyorOrders` + Requests page) already passes:

- `sort=createdAt`
- `order=desc`
- `from` / `to` when the user sets a range or taps **This month**

Until this backend work ships, the UI still sorts/filters the **current page** client-side so mobile UX works for small lists; correct multi-page month filters require this API support.
