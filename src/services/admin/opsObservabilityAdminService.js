import apiClient from "../apiClient.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";
import { normalizeOpsSlaItems } from "../../utils/sla.js";

const OBSERVABILITY_BASE = "/api/admin/ops/observability";
const HEALTH_BASE = "/api/health";

function handleError(error, fallbackMessage) {
  const message = getApiErrorMessage(error, fallbackMessage);
  const err = new Error(message);
  if (error?.correlationId) err.correlationId = error.correlationId;
  throw err;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Optional uptime probe (M-07). Never throws — dashboard stays usable if absent.
 * GET /api/health
 * @returns {Promise<{ ok: boolean, status?: string, raw: any } | null>}
 */
export async function getOpsHealth() {
  try {
    const { data } = await apiClient.get(HEALTH_BASE);
    const root = data?.data ?? data ?? {};
    const status = String(root.status ?? root.state ?? root.ok ?? "").toLowerCase();
    const ok =
      root.ok === true ||
      status === "ok" ||
      status === "up" ||
      status === "healthy" ||
      status === "true" ||
      (data?.success === true && root.ok !== false);
    return {
      ok: Boolean(ok),
      status: root.status ?? root.state ?? (ok ? "ok" : "down"),
      uptimeSeconds: root.uptimeSeconds ?? root.uptime ?? null,
      checkedAt: root.checkedAt ?? root.timestamp ?? null,
      raw: root,
    };
  } catch {
    return null;
  }
}

/**
 * Admin ops observability snapshot (M-07).
 * GET /api/admin/ops/observability
 *
 * @param {{ slaHours?: number }} [params]
 * @returns {Promise<any>}
 */
export async function getOpsObservability(params = {}) {
  try {
    const query = {};
    if (params.slaHours != null) query.slaHours = params.slaHours;
    const { data } = await apiClient.get(OBSERVABILITY_BASE, { params: query });
    return data;
  } catch (error) {
    handleError(error, "Failed to load ops observability");
  }
}

/**
 * Normalize observability payload for the admin dashboard panels.
 * @param {any} raw
 */
export function normalizeOpsObservability(raw) {
  const root = raw?.data ?? raw ?? {};

  const funnelSrc = root.funnel?.byStatus ?? root.funnel ?? root.byStatus ?? {};
  const funnelEntries =
    funnelSrc && typeof funnelSrc === "object" && !Array.isArray(funnelSrc)
      ? Object.entries(funnelSrc).map(([status, count]) => ({
          status,
          count: toNumber(count),
        }))
      : Array.isArray(funnelSrc)
        ? funnelSrc.map((row) => ({
            status: row?.status ?? row?.key ?? row?.name ?? "UNKNOWN",
            count: toNumber(row?.count ?? row?.value ?? row?.total),
          }))
        : [];

  const paymentsRoot = root.payments ?? {};
  const flagsSrc = paymentsRoot.flags ?? paymentsRoot.flagCounts ?? {};
  const paymentFlags =
    flagsSrc && typeof flagsSrc === "object" && !Array.isArray(flagsSrc)
      ? Object.entries(flagsSrc).map(([flag, count]) => ({
          flag,
          count: toNumber(count),
        }))
      : [];

  const recentPaymentMismatches = Array.isArray(root.recentPaymentMismatches)
    ? root.recentPaymentMismatches
    : Array.isArray(paymentsRoot.recentPaymentMismatches)
      ? paymentsRoot.recentPaymentMismatches
      : Array.isArray(paymentsRoot.mismatches)
        ? paymentsRoot.mismatches
        : [];

  const slaRoot = root.sla ?? {};
  const slaItemsRaw = Array.isArray(slaRoot.items)
    ? slaRoot.items
    : Array.isArray(root.slaItems)
      ? root.slaItems
      : [];
  const slaItems = normalizeOpsSlaItems(slaItemsRaw);

  const capacityRoot = root.operatorCapacity ?? root.capacity ?? {};
  const operatorCapacity = {
    available: toNumber(capacityRoot.available),
    busy: toNumber(capacityRoot.busy),
    offline: toNumber(capacityRoot.offline),
  };

  const alertsRoot = root.alerts ?? {};
  const alerts = {
    level: String(alertsRoot.level ?? alertsRoot.severity ?? alertsRoot.status ?? "").toLowerCase() || null,
    message: alertsRoot.message ?? alertsRoot.summary ?? null,
    count: alertsRoot.count != null ? toNumber(alertsRoot.count) : null,
    items: Array.isArray(alertsRoot.items)
      ? alertsRoot.items
      : Array.isArray(alertsRoot)
        ? alertsRoot
        : [],
    raw: alertsRoot,
  };

  const warningCount = slaItems.filter((r) => r.state === "WARNING").length;
  const escalatedCount = slaItems.filter((r) => r.state === "ESCALATED").length;
  const breachedFromItems = slaItems.filter((r) => r.state === "BREACHED" || r.breached).length;

  return {
    funnel: {
      byStatus: funnelEntries,
      total: funnelEntries.reduce((sum, row) => sum + row.count, 0),
    },
    payments: {
      flags: paymentFlags,
      recentPaymentMismatches,
    },
    sla: {
      breached: toNumber(slaRoot.breached ?? breachedFromItems),
      warning: toNumber(slaRoot.warning ?? warningCount),
      escalated: toNumber(slaRoot.escalated ?? escalatedCount),
      withinSla: toNumber(slaRoot.withinSla ?? slaRoot.within),
      windowHours: toNumber(slaRoot.windowHours ?? slaRoot.hours ?? 48, 48),
      items: slaItems,
    },
    operatorCapacity,
    alerts,
    generatedAt: root.generatedAt ?? root.asOf ?? root.timestamp ?? null,
    raw: root,
  };
}
