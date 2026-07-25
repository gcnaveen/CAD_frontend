/**
 * M-07 correlation id helpers (shared by apiClient + error toasts).
 */

export function newCorrelationId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read X-Correlation-Id from an Axios response, error, or headers object.
 * @param {any} source
 * @returns {string | null}
 */
export function getCorrelationId(source) {
  if (!source) return null;
  const headers =
    source.headers ??
    source.response?.headers ??
    source.config?.headers ??
    null;
  if (headers && typeof headers.get === "function") {
    const viaGetter =
      headers.get("x-correlation-id") || headers.get("X-Correlation-Id");
    if (viaGetter) return String(viaGetter);
  }
  if (headers && typeof headers === "object") {
    const raw =
      headers["x-correlation-id"] ||
      headers["X-Correlation-Id"] ||
      headers["X-CORRELATION-ID"];
    if (raw) return String(raw);
  }
  if (source.config?.correlationId) return String(source.config.correlationId);
  if (source.correlationId) return String(source.correlationId);
  return null;
}
