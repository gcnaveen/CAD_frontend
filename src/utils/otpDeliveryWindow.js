const IST_TIMEZONE = "Asia/Kolkata";
const WINDOW_START_HOUR = 9;
const WINDOW_END_HOUR = 21;

function getIstDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
}

/**
 * True when IST is outside 9:00 AM – 9:00 PM (promotional DLT window).
 * OTP on Service Implicit templates works 24/7; this warns users when DLT may still be misconfigured.
 */
export function isOutsideOtpDeliveryWindow() {
  const hour = getIstDate().getHours();
  return hour < WINDOW_START_HOUR || hour >= WINDOW_END_HOUR;
}

export function getOtpDeliveryWindowNote() {
  if (!isOutsideOtpDeliveryWindow()) return null;
  return "OTP SMS may not arrive between 9:00 PM and 9:00 AM IST. For faster delivery, try again after 9:00 AM IST.";
}

export function formatIstTime() {
  return getIstDate().toLocaleTimeString("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
