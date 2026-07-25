import apiClient from "../apiClient.js";

const BASE = "/api/admin/payments/reconciliation";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/**
 * Admin payment reconciliation report (ops / audit evidence).
 * GET /api/admin/payments/reconciliation
 *
 * @param {{
 *   date?: string,
 *   asOf?: string,
 *   from?: string,
 *   to?: string,
 *   persist?: boolean,
 * }} [params]
 * @returns {Promise<{ success?: boolean, data?: any }>}
 */
export async function getAdminPaymentReconciliation(params = {}) {
  try {
    const query = {};
    if (params.date) query.date = params.date;
    if (params.asOf) query.asOf = params.asOf;
    if (params.from) query.from = params.from;
    if (params.to) query.to = params.to;
    if (params.persist === false) query.persist = "false";
    if (params.persist === true) query.persist = "true";

    const { data } = await apiClient.get(BASE, { params: query });
    return data;
  } catch (error) {
    handleError(error, "Failed to load payment reconciliation");
  }
}

const FLAG_KEYS = [
  "MISSING",
  "DUPLICATED",
  "MISMATCHED",
  "EXPIRED",
  "REFUNDED",
  "MANUALLY_ADJUSTED",
];

/**
 * Normalize `data.flags` counts from the reconciliation response.
 * @param {any} raw
 * @returns {{ flags: Record<string, number>, meta: Record<string, any>, raw: any }}
 */
export function normalizeReconciliationReport(raw) {
  const root = raw?.data ?? raw ?? {};
  const flagsSrc = root.flags ?? root.flagCounts ?? {};
  const flags = {};
  for (const key of FLAG_KEYS) {
    const n = Number(flagsSrc[key] ?? flagsSrc[key.toLowerCase()] ?? 0);
    flags[key] = Number.isFinite(n) ? n : 0;
  }
  return {
    flags,
    meta: {
      asOf: root.asOf ?? root.date ?? null,
      from: root.from ?? null,
      to: root.to ?? null,
      persisted: root.persisted ?? root.persist ?? null,
      scannedAt: root.scannedAt ?? root.generatedAt ?? null,
      totalAttempts: root.totalAttempts ?? root.attemptCount ?? null,
    },
    items: Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.flagsDetail)
        ? root.flagsDetail
        : Array.isArray(root.details)
          ? root.details
          : [],
    raw: root,
  };
}

export { FLAG_KEYS as RECONCILIATION_FLAG_KEYS };
