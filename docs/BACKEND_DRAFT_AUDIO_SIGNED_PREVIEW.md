# Backend: Draft / order audio signed preview (listen URL)

**Audience:** Backend team  
**Frontend consumer:** Surveyor / Public **New Request** form — Drawing step audio player when loading a **draft** (`GET /api/surveyor/sketch-drafts/:id`)  
**Date:** 2026-03-24  
**Related:** H-10 private S3 uploads (`docs/FRONTEND_H10_UPLOAD_AUTH.md`)  
**Priority:** Required for “listen to saved draft audio” after reload / resume draft

---

## Problem

Upload flow stores objects as **private** in S3. In the same browser session, the frontend keeps a temporary `blob:` `previewUrl` so `<audio controls>` can play.

After draft save + reload (or open draft from URL):

- Draft has `audio.fileUrl` / `audio.url` (and ideally `key`)
- There is **no** `blob:` URL anymore
- Browser cannot play the private `fileUrl` → user sees “audio saved” but **cannot listen**

Frontend cannot fix this without a **short-lived signed GET** (or authenticated proxy) from the backend.

---

## Goal

When a surveyor opens their own draft (or order) that has audio, the API must provide a **playable HTTPS URL** the browser can use in `<audio src="…">` without AWS credentials.

---

## Recommended approach (pick one; A preferred)

### A) Enrich draft GET (simplest for this screen)

```
GET /api/surveyor/sketch-drafts/:id
Authorization: Bearer <accessToken>
```

Include on `audio` (in addition to existing identity fields):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fileUrl` / `url` | string | yes (existing) | Stable private object URL / canonical URL (not assumed playable) |
| `key` | string | **strongly recommended** | S3 object key used for re-signing |
| `downloadUrl` **or** `previewUrl` | string | **yes for playback** | Short-lived **signed GET** URL |
| `downloadUrlExpiresAt` | ISO string or epoch ms | recommended | So frontend can refresh before expiry |
| `fileName` | string | existing | |
| `mimeType` | string | existing | e.g. `audio/webm`, `audio/mpeg` |
| `size` | number | existing | |

**Example `audio` object on draft GET:**

```json
{
  "url": "https://bucket.s3.ap-south-1.amazonaws.com/…/voice.webm",
  "fileUrl": "https://bucket.s3.ap-south-1.amazonaws.com/…/voice.webm",
  "key": "uploads/surveyor/…/voice.webm",
  "fileName": "voice-note.webm",
  "mimeType": "audio/webm",
  "size": 184320,
  "downloadUrl": "https://bucket.s3.ap-south-1.amazonaws.com/…/voice.webm?X-Amz-Algorithm=…&X-Amz-Expires=900&…",
  "downloadUrlExpiresAt": "2026-03-24T11:15:00.000Z"
}
```

Same pattern should apply later to **submitted sketch uploads** if detail drawers need to play audio.

### B) Dedicated signed-read endpoint (reusable for docs/images too)

```
POST /api/upload/signed-read
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "key": "uploads/surveyor/…/voice.webm",
  "fileUrl": "https://…",   // optional if key omitted; backend resolves
  "ttlSeconds": 900
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://…?X-Amz-…",
    "expiresAt": "2026-03-24T11:15:00.000Z",
    "key": "uploads/surveyor/…/voice.webm"
  }
}
```

**AuthZ rules (must match upload ownership):**

- Caller must be authenticated (same H-10 Bearer).
- Object must belong to the caller (draft/order owner), or admin/CAD with assignment rights.
- Cross-user → **403**.
- Missing / unknown key → **404**.
- Quarantined / unconfirmed objects → **403** or **404** (do not sign).

Frontend will call this on draft hydrate when `downloadUrl` / `previewUrl` is missing but `key` or `fileUrl` is present. Prefer **A + B**: enrich draft for zero extra round-trip; keep B for refresh after expiry and for other file types.

---

## Draft save payload (frontend already sending / will send)

On create/update draft, frontend persists:

```json
{
  "audio": {
    "url": "<fileUrl>",
    "fileUrl": "<fileUrl>",
    "key": "<s3-key-if-known>",
    "fileName": "…",
    "mimeType": "audio/webm",
    "size": 12345
  }
}
```

Please **store `key`** on the draft document (not only `fileUrl`). Signing by key is more reliable than parsing URLs.

Do **not** require the client to persist `downloadUrl` — it expires; always mint fresh on GET / signed-read.

---

## TTL / CORS

| Concern | Recommendation |
|---------|----------------|
| Signed URL TTL | 5–15 minutes for preview; 15 minutes is fine |
| S3 CORS | Allow GET from the frontend origin(s) for the bucket (or CloudFront) so `<audio>` can fetch |
| Content-Type | Object should retain correct audio MIME so browsers decode reliably |

---

## Acceptance criteria

1. Open draft with audio → Drawing step `<audio>` can play end-to-end without a same-session blob.
2. Signed URL works only for the owning surveyor (or authorized roles); other users get 403.
3. Expired URL can be refreshed via draft re-GET or `POST /api/upload/signed-read`.
4. Private `fileUrl` alone is **not** treated as publicly playable (H-10 stays intact).
5. Draft without audio unchanged.

---

## Frontend wiring (already / shortly in this repo)

- Maps `audio.downloadUrl` \| `audio.previewUrl` \| `audio.signedUrl` → player `previewUrl`.
- Prefers that over private `fileUrl` for `<audio src>`.
- Persists `key` on draft save when available.
- Optionally calls `POST /api/upload/signed-read` if draft GET has no playable URL yet (ignores 404 until this ships).

No schema change to unrelated collections beyond storing `audio.key` and returning a signed read URL.
