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

/**
 * @param {any} raw — API envelope or inner data
 */
export function normalizePublicBusinessRules(raw) {
  const envelope = raw?.data ?? raw ?? {};
  const root =
    envelope?.data != null &&
    envelope?.cadOperatorEarnings == null &&
    envelope?.lifecycleMachine == null &&
    envelope?.qc == null
      ? envelope.data
      : envelope;

  const cadOperatorEarnings = normalizeCadOperatorEarnings(
    root?.cadOperatorEarnings ?? root?.cadPayout ?? FALLBACK_CAD_OPERATOR_EARNINGS
  );

  const lifecycleMachine = normalizeLifecycleMachine(
    root?.lifecycleMachine ?? FALLBACK_LIFECYCLE_MACHINE
  );

  const qc = normalizeQc(root?.qc ?? FALLBACK_QC);

  return {
    cadOperatorEarnings,
    lifecycleMachine,
    qc,
    raw: root,
  };
}

/**
 * GET /api/public/business-rules — public pricing / payout / lifecycle / QC (H-11, M-08).
 * Falls back to FIXED ₹400 CAD earnings and committed LIFECYCLE_QC_SPEC_M08 when unavailable.
 *
 * @returns {Promise<{
 *   cadOperatorEarnings: import("../../utils/cadOperatorEarnings.js").CadOperatorEarnings,
 *   lifecycleMachine: import("../../utils/lifecycleQc.js").LifecycleMachine,
 *   qc: import("../../utils/lifecycleQc.js").QcRules,
 *   raw: any,
 * }>}
 */
export async function getPublicBusinessRules() {
  try {
    const { data } = await apiClient.get("/api/public/business-rules");
    return normalizePublicBusinessRules(data);
  } catch {
    return normalizePublicBusinessRules({
      cadOperatorEarnings: FALLBACK_CAD_OPERATOR_EARNINGS,
      lifecycleMachine: FALLBACK_LIFECYCLE_MACHINE,
      qc: FALLBACK_QC,
    });
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
