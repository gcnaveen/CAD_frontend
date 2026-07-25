# Frontend — H-10 authenticated upload presign

**Breaking change:** anonymous `POST /api/upload/image` and `/api/upload/audio` return **401**. Every upload route requires `Authorization: Bearer <accessToken>` for an active surveyor / CAD / admin user.

Also covers **H-07 file safeguards**: always send `fileSizeBytes`, call `POST /api/upload/confirm` after S3 PUT, and never attach URLs on `FILE_QUARANTINED`.

## Required request shape

```http
POST /api/upload/image
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "fileName": "sketch.png",
  "contentType": "image/png",
  "fileSizeBytes": 245760,
  "entityId": "<orderId or omit for misc>"
}
```

Same for `/api/upload/audio` with audio MIME/extensions.

| Field | Required | Notes |
|-------|----------|--------|
| `fileName` | yes | Extension must be allow-listed |
| `fileSizeBytes` | yes | 1…max (images 10MB, audio 25MB) |
| `contentType` | recommended | Inferred from extension if `application/octet-stream` |
| `entityId` | recommended | Order id you own / are assigned; cross-user → **403** |

Batch: `files: [{ fileName, contentType, fileSizeBytes }, …]` (each item needs size).

## Client flow

1. Call presign with JWT + `fileSizeBytes`.
2. `PUT` raw bytes to `signedUploadUrl` with exactly `uploadHeaders` (`Content-Type`). Do **not** add `Authorization` or extra `x-amz-*` headers on the S3 PUT.
3. `POST /api/upload/confirm` with `{ key, contentType, fileName }` and the same JWT.
4. Only after confirm succeeds, attach `fileUrl` / `key` to sketch / order payloads.
5. Treat objects as **private** until confirm; do not assume the S3 URL is public.
6. On `FILE_QUARANTINED`, do **not** attach that URL.

## Implementation map (this repo)

| Concern | Location |
|---------|----------|
| Bearer on upload APIs | `src/services/upload/upload.api.js` → `apiClient` |
| Presign → PUT → confirm | `src/services/upload/upload.service.js` |
| Auth / quarantine errors | `src/services/upload/upload.errors.js` |
| Hook wrapper | `src/hooks/useFileUpload.js` |

Call sites should use `uploadImageToS3` / `uploadAudioToS3` only (no direct anonymous `axios` to `/api/upload/*`).

## Errors to handle

| Status / code | Meaning |
|---------------|---------|
| 401 | Missing/invalid/expired token, or inactive user |
| 403 | Wrong role, not your order, not your object, quota |
| 400 / `FILE_QUARANTINED` | Bad MIME/extension/size, or scan quarantine |
| 429 | Presign rate limit |

## Key prefix (do not forge)

Objects are stored as `uploads/{images\|audio}/user/{yourUserId}/{entityId}/…`. Delete/confirm for another user’s key returns **403**.

## Guest / public forms

Anonymous resume upload (e.g. CAD interest) cannot use `/api/upload/*` under H-10. Either require sign-in before upload, or submit without a file URL.
