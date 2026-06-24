import { getApiErrorMessage } from "./apiErrorMessage.js";

const DLT_TIMING_PATTERNS = [
  /invalid sms timing/i,
  /dlt.*timing/i,
  /timing.*dlt/i,
  /outside.*delivery.*hours/i,
  /promotional.*window/i,
];

export const OTP_DLT_TIMING_USER_MESSAGE =
  "SMS could not be delivered right now due to telecom delivery-hour rules. " +
  "Please try again between 9:00 AM and 9:00 PM IST. " +
  "If this happens during daytime, contact support — the OTP template may need to be re-registered as Service Implicit on DLT.";

export function isDltTimingError(message = "") {
  return DLT_TIMING_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Turn raw OTP send failures into clearer user-facing text.
 */
export function formatOtpSendError(error, fallback = "Failed to send OTP. Please try again.") {
  const raw = getApiErrorMessage(error, fallback);
  if (isDltTimingError(raw)) return OTP_DLT_TIMING_USER_MESSAGE;
  return raw;
}
