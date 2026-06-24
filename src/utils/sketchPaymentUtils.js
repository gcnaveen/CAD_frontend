const LAST_PAYMENT_KEY = "cad:lastPayment";

/**
 * Whether the surveyor can retry initial sketch upload payment (PhonePe).
 */
export function canRetrySketchPayment(upload) {
  return (
    upload?.status === "PAYMENT_PENDING" &&
    (upload?.sketchPayment?.status === "FAILED" ||
      upload?.sketchPayment?.status === "PENDING")
  );
}

export function isSketchPaymentCompleted(upload) {
  const paymentStatus = String(
    upload?.sketchPayment?.status || upload?.sketchPayment?.paymentStatus || ""
  ).toUpperCase();
  if (paymentStatus === "COMPLETED" || paymentStatus === "SUCCESS" || paymentStatus === "PAID") {
    return true;
  }
  if (upload?.sketchPayment?.paidAt) {
    return true;
  }
  return false;
}

/**
 * Resolve upload id after PhonePe redirect from query, router state, or last payment context.
 */
export function resolveSketchPaymentUploadId(searchParams, locationState) {
  const fromQuery = searchParams?.get?.("uploadId");
  if (fromQuery && String(fromQuery).trim()) return String(fromQuery).trim();

  const fromState =
    locationState?.uploadId ?? locationState?.openOrderId ?? locationState?.orderId ?? null;
  if (fromState && String(fromState).trim()) return String(fromState).trim();

  return readSketchPaymentContext()?.uploadId || null;
}

export function getPaymentCheckoutUrl(paymentMeta) {
  const checkout =
    typeof paymentMeta?.checkoutPageUrl === "string" ? paymentMeta.checkoutPageUrl.trim() : "";
  const redirect = typeof paymentMeta?.redirectUrl === "string" ? paymentMeta.redirectUrl.trim() : "";
  return checkout || redirect || "";
}

export function formatSketchPayableRupees(upload, paymentMeta) {
  const fromMeta = paymentMeta?.payableRupees ?? paymentMeta?.planAmountRupees;
  if (fromMeta != null && Number.isFinite(Number(fromMeta))) {
    return Number(fromMeta);
  }
  const fromSketch = upload?.sketchPayment?.planAmountRupees;
  if (fromSketch != null && Number.isFinite(Number(fromSketch))) {
    const discount = Number(upload?.sketchPayment?.discountRupees || 0);
    return Number(fromSketch) - discount;
  }
  const paise =
    paymentMeta?.amountPaise ??
    upload?.sketchPayment?.amountPaise ??
    upload?.sketchPayment?.amount_paise ??
    null;
  if (paise != null && Number.isFinite(Number(paise))) {
    return Number(paise) / 100;
  }
  return null;
}

export function saveSketchPaymentContext({
  uploadId,
  merchantOrderId,
  amountPaise,
  redirectUrl,
  revisionNo,
}) {
  try {
    localStorage.setItem(
      LAST_PAYMENT_KEY,
      JSON.stringify({
        uploadId,
        merchantOrderId: merchantOrderId ?? null,
        amountPaise: amountPaise ?? null,
        revisionNo: revisionNo ?? null,
        startedAt: new Date().toISOString(),
        redirectUrl: redirectUrl ?? null,
      })
    );
  } catch {
    // localStorage can fail (private mode / quota)
  }
}

export function readSketchPaymentContext() {
  try {
    const raw = localStorage.getItem(LAST_PAYMENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSketchPaymentContext() {
  try {
    localStorage.removeItem(LAST_PAYMENT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Persist payment context and redirect to PhonePe checkout (same tab).
 * @returns {boolean} true if redirect was started
 */
export function redirectToSketchCheckout(paymentMeta, uploadId) {
  const redirectUrl = getPaymentCheckoutUrl(paymentMeta);
  if (!redirectUrl) return false;

  saveSketchPaymentContext({
    uploadId: uploadId ?? paymentMeta?.uploadId ?? null,
    merchantOrderId: paymentMeta?.merchantOrderId ?? null,
    amountPaise: paymentMeta?.amountPaise ?? null,
    redirectUrl,
  });

  window.location.assign(redirectUrl);
  return true;
}

export function normalizeSketchPaymentPageState(upload) {
  const sketchPaymentStatus = String(
    upload?.sketchPayment?.status ||
      upload?.sketchPayment?.paymentStatus ||
      upload?.payment?.status ||
      ""
  ).toUpperCase();
  const orderStatus = String(upload?.status || "").toUpperCase();

  if (isSketchPaymentCompleted(upload)) {
    return "success";
  }

  if (orderStatus === "PAYMENT_PENDING") {
    if (
      sketchPaymentStatus === "FAILED" ||
      sketchPaymentStatus.includes("FAIL") ||
      sketchPaymentStatus.includes("DECLINED") ||
      sketchPaymentStatus.includes("CANCEL")
    ) {
      return "failed";
    }
    if (sketchPaymentStatus === "PENDING" || sketchPaymentStatus.includes("INIT")) {
      return "pending";
    }
  }

  const combined = sketchPaymentStatus || orderStatus;
  if (combined.includes("SUCCESS") || combined.includes("PAID") || combined.includes("COMPLETED")) {
    return "success";
  }
  if (combined.includes("FAIL") || combined.includes("DECLINED") || combined.includes("CANCEL")) {
    return "failed";
  }
  if (combined.includes("PENDING") || combined.includes("INIT") || combined.includes("PROCESS")) {
    return "pending";
  }
  return "unknown";
}
