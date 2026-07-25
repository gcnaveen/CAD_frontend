const LAST_PAYMENT_KEY = "cad:lastPayment";

/**
 * Whether the surveyor can retry initial sketch upload payment (PhonePe).
 * AMOUNT_MISMATCH is treated like FAILED (underpaid / client amount rejected).
 */
export function canRetrySketchPayment(upload) {
  const s = String(
    upload?.sketchPayment?.status || upload?.sketchPayment?.paymentStatus || ""
  ).toUpperCase();
  return (
    upload?.status === "PAYMENT_PENDING" &&
    (s === "FAILED" || s === "AMOUNT_MISMATCH" || s === "PENDING")
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
 * Whether CAD balance (download entitlement) payment has completed.
 */
export function isBalancePaymentCompleted(upload) {
  if (upload?.downloadEntitlement?.granted) return true;
  const status = String(
    upload?.balancePayment?.status ||
      upload?.downloadEntitlement?.balancePaymentStatus ||
      ""
  ).toUpperCase();
  return status === "COMPLETED" || status === "SUCCESS" || status === "PAID";
}

/**
 * True when the last checkout context (or payment meta) is CAD balance / download gate.
 */
export function isCadBalancePaymentPurpose(purposeOrMeta) {
  const purpose =
    typeof purposeOrMeta === "string"
      ? purposeOrMeta
      : purposeOrMeta?.purpose ?? readSketchPaymentContext()?.purpose ?? "";
  return String(purpose || "").toUpperCase() === "CAD_BALANCE";
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
  const fromSketchPayable = upload?.sketchPayment?.payableRupees;
  if (fromSketchPayable != null && Number.isFinite(Number(fromSketchPayable))) {
    return Number(fromSketchPayable);
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
  purpose,
}) {
  try {
    localStorage.setItem(
      LAST_PAYMENT_KEY,
      JSON.stringify({
        uploadId,
        merchantOrderId: merchantOrderId ?? null,
        amountPaise: amountPaise ?? null,
        revisionNo: revisionNo ?? null,
        purpose: purpose ?? null,
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
 * amountPaise is stored from server meta for display only — never resent on initiate.
 * @param {object} paymentMeta
 * @param {string|null} uploadId
 * @param {{ purpose?: string }} [options] — e.g. `{ purpose: "CAD_BALANCE" }` when server omits it
 * @returns {boolean} true if redirect was started
 */
export function redirectToSketchCheckout(paymentMeta, uploadId, options = {}) {
  const redirectUrl = getPaymentCheckoutUrl(paymentMeta);
  if (!redirectUrl) return false;

  saveSketchPaymentContext({
    uploadId: uploadId ?? paymentMeta?.uploadId ?? null,
    merchantOrderId: paymentMeta?.merchantOrderId ?? null,
    amountPaise: paymentMeta?.amountPaise ?? null,
    purpose: options.purpose ?? paymentMeta?.purpose ?? null,
    redirectUrl,
  });

  window.location.assign(redirectUrl);
  return true;
}

/**
 * Normalize return-page state for upload booking OR CAD balance checkout.
 * Pass purpose "CAD_BALANCE" (or rely on lastPayment context) after balance-payment redirect.
 */
export function normalizeSketchPaymentPageState(upload, purpose) {
  const resolvedPurpose = purpose ?? readSketchPaymentContext()?.purpose ?? null;

  if (isCadBalancePaymentPurpose(resolvedPurpose)) {
    if (isBalancePaymentCompleted(upload)) return "success";

    const balStatus = String(
      upload?.balancePayment?.status ||
        upload?.downloadEntitlement?.balancePaymentStatus ||
        upload?.downloadEntitlement?.reason ||
        ""
    ).toUpperCase();

    if (
      balStatus.includes("FAIL") ||
      balStatus.includes("DECLINED") ||
      balStatus.includes("CANCEL") ||
      balStatus === "AMOUNT_MISMATCH"
    ) {
      return "failed";
    }
    if (
      balStatus.includes("PENDING") ||
      balStatus === "REQUIRED" ||
      balStatus.includes("INIT") ||
      balStatus.includes("PROCESS")
    ) {
      return "pending";
    }
    if (balStatus.includes("REFUND")) return "failed";
    return "pending";
  }

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
      sketchPaymentStatus === "AMOUNT_MISMATCH" ||
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
  if (
    combined === "AMOUNT_MISMATCH" ||
    combined.includes("FAIL") ||
    combined.includes("DECLINED") ||
    combined.includes("CANCEL")
  ) {
    return "failed";
  }
  if (combined.includes("PENDING") || combined.includes("INIT") || combined.includes("PROCESS")) {
    return "pending";
  }
  return "unknown";
}
