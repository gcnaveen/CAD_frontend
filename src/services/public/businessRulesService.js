import apiClient from "../apiClient.js";
import {
  FALLBACK_CAD_OPERATOR_EARNINGS,
  normalizeCadOperatorEarnings,
} from "../../utils/cadOperatorEarnings.js";
import {
  FALLBACK_LIFECYCLE_MACHINE,
  FALLBACK_QC,
  normalizeLifecycleMachine,
  normalizeQc,
} from "../../utils/lifecycleQc.js";
import {
  DEFAULT_SUPPORT_WHATSAPP_PHONE,
  SUPPORT_EMAIL,
  getWhatsAppSupportUrl,
} from "../../constants/siteMeta.js";

/**
 * SUPPORT-01 / LEGAL-01 — public support + refund blocks from business-rules.
 * @param {any} raw
 */
export function normalizeSupportContact(raw) {
  const s =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? raw.supportContact && typeof raw.supportContact === "object"
        ? raw.supportContact
        : raw
      : {};

  const whatsappUrl = String(
    s.whatsappUrl || s.whatsAppUrl || s.url || s.SUPPORT_WHATSAPP_URL || ""
  ).trim();
  const whatsappNumber = String(
    s.whatsappNumber ||
      s.whatsAppNumber ||
      s.number ||
      s.phone ||
      s.SUPPORT_WHATSAPP_NUMBER ||
      ""
  )
    .trim()
    .replace(/\D/g, "");
  const email = String(s.email || s.supportEmail || s.SUPPORT_EMAIL || "").trim();

  let resolvedUrl = whatsappUrl || null;
  if (!resolvedUrl && whatsappNumber) {
    const text = encodeURIComponent("Hi North-cot Support");
    resolvedUrl = `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${text}&type=phone_number&app_absent=0`;
  }

  return {
    whatsappUrl: resolvedUrl,
    whatsappNumber: whatsappNumber || null,
    email: email || null,
  };
}

/**
 * @param {any} raw
 */
export function normalizeRefundPolicy(raw) {
  const r =
    raw && typeof raw === "object"
      ? raw.refundPolicy && typeof raw.refundPolicy === "object"
        ? raw.refundPolicy
        : typeof raw.refundPolicy === "string"
          ? { summary: raw.refundPolicy }
          : raw
      : {};
  const summary = String(r.summary || r.description || r.text || r.copy || "").trim();
  const title = String(r.title || "").trim();
  return {
    title: title || null,
    summary: summary || null,
  };
}

/**
 * Format a phone number for display (India-friendly). Returns null when empty.
 * @param {string | null | undefined} digits
 */
export function formatSupportPhoneDisplay(digits) {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 12 && d.startsWith("91")) {
    return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  }
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return `+${d}`;
}

/**
 * @param {any} raw — API envelope or inner data
 * @param {{ fromApi?: boolean }} [opts]
 */
export function normalizePublicBusinessRules(raw, opts = {}) {
  const envelope = raw?.data ?? raw ?? {};
  const root =
    envelope?.data != null &&
    envelope?.cadOperatorEarnings == null &&
    envelope?.lifecycleMachine == null &&
    envelope?.qc == null &&
    envelope?.supportContact == null &&
    envelope?.refundPolicy == null
      ? envelope.data
      : envelope;

  const hasEarningsBlock =
    root?.cadOperatorEarnings != null || root?.cadPayout != null;
  const hasRefund =
    root?.refundPolicy != null &&
    String(
      typeof root.refundPolicy === "string"
        ? root.refundPolicy
        : root.refundPolicy?.summary ||
            root.refundPolicy?.description ||
            root.refundPolicy?.text ||
            ""
    ).trim() !== "";
  const hasSupport =
    root?.supportContact != null ||
    root?.whatsappUrl != null ||
    root?.whatsappNumber != null ||
    root?.email != null;

  const cadOperatorEarnings = normalizeCadOperatorEarnings(
    root?.cadOperatorEarnings ?? root?.cadPayout ?? FALLBACK_CAD_OPERATOR_EARNINGS
  );

  const lifecycleMachine = normalizeLifecycleMachine(
    root?.lifecycleMachine ?? FALLBACK_LIFECYCLE_MACHINE
  );

  const qc = normalizeQc(root?.qc ?? FALLBACK_QC);
  const supportContact = normalizeSupportContact(root);
  const refundPolicy = normalizeRefundPolicy(root);

  const fromApi =
    typeof opts.fromApi === "boolean"
      ? opts.fromApi
      : Boolean(hasEarningsBlock || hasRefund || hasSupport || root?.qc || root?.lifecycleMachine);

  return {
    cadOperatorEarnings,
    lifecycleMachine,
    qc,
    supportContact,
    refundPolicy,
    fromApi,
    raw: root,
  };
}

/**
 * GET /api/public/business-rules — public pricing / payout / lifecycle / QC / support.
 * Soft-fails to local siteMeta + M-08 fallbacks when the endpoint is unavailable.
 */
export async function getPublicBusinessRules() {
  try {
    const { data } = await apiClient.get("/api/public/business-rules");
    return normalizePublicBusinessRules(data, { fromApi: true });
  } catch {
    return {
      ...normalizePublicBusinessRules({
        cadOperatorEarnings: FALLBACK_CAD_OPERATOR_EARNINGS,
        lifecycleMachine: FALLBACK_LIFECYCLE_MACHINE,
        qc: FALLBACK_QC,
        supportContact: {
          whatsappUrl: getWhatsAppSupportUrl(),
          whatsappNumber: DEFAULT_SUPPORT_WHATSAPP_PHONE,
          email: SUPPORT_EMAIL,
        },
      }),
      fromApi: false,
    };
  }
}

/**
 * Convenience: only CAD operator earnings block.
 */
export async function getCadOperatorEarningsRules() {
  const rules = await getPublicBusinessRules();
  return rules.cadOperatorEarnings;
}

/**
 * Convenience: lifecycle machine (labels, legacy map, notification/analytics keys).
 */
export async function getLifecycleMachineRules() {
  const rules = await getPublicBusinessRules();
  return rules.lifecycleMachine;
}

/**
 * Convenience: QC (11E / checkCount 10) copy block.
 */
export async function getQcRules() {
  const rules = await getPublicBusinessRules();
  return rules.qc;
}

/**
 * SUPPORT-01 — prefer BE supportContact; fall back to Vite env / siteMeta defaults.
 */
export async function getSupportContact() {
  const rules = await getPublicBusinessRules();
  const fromApi = rules.supportContact || {};
  return {
    whatsappUrl: fromApi.whatsappUrl || getWhatsAppSupportUrl(),
    whatsappNumber: fromApi.whatsappNumber || DEFAULT_SUPPORT_WHATSAPP_PHONE,
    email: fromApi.email || SUPPORT_EMAIL,
    fromApi: Boolean(rules.fromApi),
  };
}

/**
 * LEGAL-01 — refund policy block from business-rules (null summary when API omitted it).
 */
export async function getRefundPolicy() {
  const rules = await getPublicBusinessRules();
  return {
    ...rules.refundPolicy,
    fromApi: Boolean(rules.fromApi && rules.refundPolicy?.summary),
  };
}
