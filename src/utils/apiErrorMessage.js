/**
 * Extract a user-facing message from API error responses.
 * Supports { message } and { errors: [{ message }] } shapes.
 */
export function getApiErrorMessage(error, fallback = "Request failed") {
  const body = error?.response?.data;
  if (!body) return error?.message ?? fallback;
  if (body.errors?.[0]?.message) return body.errors[0].message;
  if (body.message) return body.message;
  return fallback;
}
