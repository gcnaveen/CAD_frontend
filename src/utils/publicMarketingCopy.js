/**
 * LEGAL-01 / PRICE-02 — homepage marketing copy from public business-rules.
 * Never invent refund wording or revision prices.
 */

export const SAFE_REFUND_FALLBACK =
  "Refund terms are published in our Terms of Service and confirmed at checkout.";

export const SAFE_REVISION_FALLBACK =
  "1st revision free within 48 hours. Later revision fees are confirmed at checkout.";

function isRefundQuestion(question) {
  const q = String(question || "").toLowerCase();
  return q.includes("refund") || q.includes("ರಿಫಂಡ್");
}

function isRevisionQuestion(question) {
  const q = String(question || "").toLowerCase();
  return q.includes("revision") || q.includes("ಪರಿಷ್ಕರಣೆ");
}

/**
 * Authoritative revision rupees from public business-rules when present.
 * Returns null when omitted; 0 when the API explicitly reports zero.
 * Does not fall back to booking fee or a hardcoded ₹100.
 */
export function revisionRupeesFromRules(rules) {
  if (!rules || typeof rules !== "object") return null;
  const raw = rules.raw && typeof rules.raw === "object" ? rules.raw : {};
  const earnings =
    rules.cadOperatorEarnings && typeof rules.cadOperatorEarnings === "object"
      ? rules.cadOperatorEarnings
      : {};
  const pricing = raw.pricing && typeof raw.pricing === "object" ? raw.pricing : {};
  const revision =
    (pricing.revision && typeof pricing.revision === "object" && pricing.revision) ||
    (raw.revision && typeof raw.revision === "object" && raw.revision) ||
    (raw.revisionFee && typeof raw.revisionFee === "object" && raw.revisionFee) ||
    null;

  const rupeeCandidates = [
    earnings.revisionRupees,
    raw.revisionRupees,
    revision?.payableRupees,
    revision?.revisionRupees,
  ];
  for (const value of rupeeCandidates) {
    if (value != null && value !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  const paiseCandidates = [
    earnings.revisionPaise,
    raw.revisionPaise,
    revision?.feePaise,
    revision?.revisionPaise,
  ];
  for (const value of paiseCandidates) {
    if (value != null && value !== "" && Number.isFinite(Number(value))) {
      return Number(value) / 100;
    }
  }
  return null;
}

export function formatRevisionFeeLabel(rupees) {
  if (rupees == null || !Number.isFinite(Number(rupees)) || Number(rupees) <= 0) {
    return null;
  }
  return `₹${Number(rupees)}`;
}

/**
 * Overlay FAQ answers with canonical backend refund policy when available.
 * Revision answers never keep a hardcoded ₹100 unless the caller supplies
 * an authoritative fee label from the pricing API.
 */
export function applyCanonicalFaqAnswers(
  items,
  {
    refundSummary,
    revisionFeeLabel,
    refundFallback = SAFE_REFUND_FALLBACK,
    revisionFallback = SAFE_REVISION_FALLBACK,
  } = {}
) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || typeof item !== "object") return item;
    if (isRefundQuestion(item.question)) {
      return {
        ...item,
        answer: refundSummary || item.answerFallback || refundFallback,
      };
    }
    if (isRevisionQuestion(item.question) && !revisionFeeLabel) {
      return {
        ...item,
        answer: item.answerFallback || revisionFallback,
      };
    }
    return item;
  });
}
