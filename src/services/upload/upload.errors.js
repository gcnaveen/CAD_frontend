/**
 * H-10 / H-07: upload auth and post-confirm quarantine errors.
 */

export class QuarantinedFileError extends Error {
  constructor(
    message = "This file was blocked by security scanning and cannot be attached."
  ) {
    super(message);
    this.name = "QuarantinedFileError";
    this.code = "FILE_QUARANTINED";
  }
}

/** H-10: every presign requires a Bearer access token. */
export class UploadAuthRequiredError extends Error {
  constructor(
    message = "Sign in required to upload files. Anonymous uploads are not allowed."
  ) {
    super(message);
    this.name = "UploadAuthRequiredError";
    this.code = "UPLOAD_AUTH_REQUIRED";
    this.status = 401;
  }
}

/**
 * @param {unknown} errorOrBody
 * @returns {boolean}
 */
export function isFileQuarantined(errorOrBody) {
  if (!errorOrBody) return false;
  if (errorOrBody instanceof QuarantinedFileError) return true;
  if (errorOrBody?.code === "FILE_QUARANTINED") return true;

  const body = errorOrBody?.response?.data ?? errorOrBody;
  if (!body || typeof body !== "object") {
    return String(errorOrBody?.message ?? "").includes("FILE_QUARANTINED");
  }

  const code = String(body.code ?? body.error ?? body.errorCode ?? "");
  if (code === "FILE_QUARANTINED") return true;
  return String(body.message ?? "").includes("FILE_QUARANTINED");
}

/**
 * Extract API error code from axios-style or plain errors.
 * @param {unknown} err
 * @returns {string}
 */
export function getUploadErrorCode(err) {
  if (!err) return "";
  if (typeof err.code === "string" && err.code) return err.code;
  const body = err?.response?.data ?? err?.data;
  if (body && typeof body === "object") {
    const code = body.code ?? body.error ?? body.errorCode;
    if (code) return String(code);
  }
  return "";
}

const H12_ERROR_MESSAGES = {
  CAD_SOURCE_REQUIRED:
    "At least one source .dwg or .dxf file is required. PDF/image alone cannot be delivered.",
  CAD_SOURCE_CONFIRM_REQUIRED:
    "CAD source file must be confirmed before delivery. Re-upload the .dwg/.dxf and try again.",
  DWG_HEADER_INVALID:
    "The DWG file appears corrupted or is not a valid AutoCAD drawing.",
  DXF_HEADER_INVALID:
    "The DXF file appears corrupted or is not a valid DXF drawing.",
  FILE_QUARANTINED:
    "This file was blocked by security scanning and cannot be attached.",
};

/**
 * Map H-10 / H-12 upload HTTP statuses and codes to user-facing messages.
 * @param {unknown} err
 * @returns {string}
 */
export function getUploadErrorMessage(err) {
  if (err instanceof UploadAuthRequiredError) {
    return err.message;
  }

  const code = getUploadErrorCode(err);
  if (code && H12_ERROR_MESSAGES[code]) {
    return (
      err?.response?.data?.message ||
      err?.message ||
      H12_ERROR_MESSAGES[code]
    );
  }

  if (isFileQuarantined(err)) {
    return (
      err?.response?.data?.message ||
      err?.message ||
      H12_ERROR_MESSAGES.FILE_QUARANTINED
    );
  }

  const status = err?.response?.status ?? err?.status;
  const body = err?.response?.data;
  const apiMessage =
    body?.errors?.[0]?.message || body?.message || err?.message;

  if (status === 401) {
    return (
      apiMessage ||
      "Your session expired or is invalid. Sign in again to upload."
    );
  }
  if (status === 403) {
    return (
      apiMessage ||
      "You do not have permission to upload for this order or object."
    );
  }
  if (status === 429) {
    return (
      apiMessage ||
      "Too many upload requests. Please wait a moment and try again."
    );
  }
  if (status === 400) {
    return (
      apiMessage ||
      (code === "FILE_QUARANTINED"
        ? "This recording failed security checks (file type mismatch). Re-record and try again."
        : "Invalid file type, extension, or size.")
    );
  }

  return apiMessage || "Upload failed";
}
