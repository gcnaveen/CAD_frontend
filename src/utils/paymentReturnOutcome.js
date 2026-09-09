/**
 * The payment gateway returns to the dashboard as `?payment=<outcome>`.
 * A browser redirect is not proof of payment, so "success" here only means the
 * gateway reported success — Requests shows the server-confirmed status.
 */

export const PAYMENT_QUERY_KEY = "payment";

const SUCCESS_VALUES = new Set([
  "success",
  "successful",
  "completed",
  "complete",
  "paid",
]);

const FAILURE_VALUES = new Set([
  "cancel",
  "cancelled",
  "canceled",
  "fail",
  "failed",
  "failure",
  "declined",
  "error",
]);

/**
 * @param {unknown} value raw `payment` query value
 * @returns {"success" | "failed" | "unknown" | null} null when absent
 */
export function normalizePaymentOutcome(value) {
  const key = String(value ?? "").trim().toLowerCase();
  if (!key) return null;
  if (SUCCESS_VALUES.has(key)) return "success";
  if (FAILURE_VALUES.has(key)) return "failed";
  return "unknown";
}
