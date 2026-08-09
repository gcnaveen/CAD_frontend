/**
 * Extract a user-facing message from API error responses.
 * Supports { message } and { errors: [{ message }] } shapes.
 * Never surfaces secret names/values (H-01: SECRETS_MISCONFIGURED).
 * H-07/H-10: FILE_QUARANTINED → do not treat as a usable upload URL.
 *
 * Correlation IDs stay on the request (`X-Correlation-Id`) for backend logs.
 * They are not appended to UI copy — users should only see the real error text
 * (e.g. "Invalid credentials"), not a support UUID.
 */
const GENERIC_SERVICE_UNAVAILABLE =
  "Service temporarily unavailable. Please try again later.";

const FILE_QUARANTINED_MESSAGE =
  "This file was blocked by security scanning and cannot be attached.";

function isSecretsMisconfigured(body) {
  if (!body || typeof body !== "object") return false;
  const code = String(body.code ?? body.error ?? body.errorCode ?? "");
  if (code === "SECRETS_MISCONFIGURED") return true;
  const msg = String(body.message ?? "");
  return msg.includes("SECRETS_MISCONFIGURED");
}

function isFileQuarantined(body, error) {
  if (error?.code === "FILE_QUARANTINED") return true;
  if (!body || typeof body !== "object") {
    return String(error?.message ?? "").includes("FILE_QUARANTINED");
  }
  const code = String(body.code ?? body.error ?? body.errorCode ?? "");
  if (code === "FILE_QUARANTINED") return true;
  return String(body.message ?? "").includes("FILE_QUARANTINED");
}

export function getApiErrorMessage(error, fallback = "Request failed") {
  const body = error?.response?.data;
  let message;
  if (isSecretsMisconfigured(body)) {
    message = GENERIC_SERVICE_UNAVAILABLE;
  } else if (isFileQuarantined(body, error)) {
    message = body?.message || error?.message || FILE_QUARANTINED_MESSAGE;
  } else if (!body) {
    message = error?.message ?? fallback;
  } else if (body.errors?.[0]?.message) {
    const nested = body.errors[0].message;
    if (String(nested).includes("SECRETS_MISCONFIGURED")) {
      message = GENERIC_SERVICE_UNAVAILABLE;
    } else if (String(nested).includes("FILE_QUARANTINED")) {
      message = FILE_QUARANTINED_MESSAGE;
    } else {
      message = nested;
    }
  } else if (body.message) {
    message = body.message;
  } else {
    message = fallback;
  }
  return message;
}
