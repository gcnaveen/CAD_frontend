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
 * Count a backend alert field without inventing values.
 * Accepts number, boolean, numeric string, array, or { count } / flag-map objects.
 */
export function countAlertField(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, value) : 0;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, n);
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "yes") return 1;
    if (s === "false" || s === "no") return 0;
    return 0;
  }
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countAlertField(item), 0);
  }
  if (typeof value === "object") {
    if (value.count != null && typeof value.count !== "object") {
      return countAlertField(value.count);
    }
    return Object.values(value).reduce((sum, v) => sum + countAlertField(v), 0);
  }
  return 0;
}

function pickFirstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

function buildAlertMessage({ slaBreach, slaEscalated, slaWarning, paymentFlags, noAvailableCad }) {
  const parts = [];
  if (slaBreach > 0) parts.push(`${slaBreach} SLA breach${slaBreach === 1 ? "" : "es"}`);
  if (slaEscalated > 0) parts.push(`${slaEscalated} SLA escalation${slaEscalated === 1 ? "" : "s"}`);
  if (slaWarning > 0) parts.push(`${slaWarning} SLA warning${slaWarning === 1 ? "" : "s"}`);
  if (paymentFlags > 0) parts.push(`${paymentFlags} payment flag${paymentFlags === 1 ? "" : "s"}`);
  if (noAvailableCad > 0) parts.push("No available CAD");
  return parts.length ? parts.join(". ") + "." : "No active alerts.";
}

function deriveAlertLevel({ slaBreach, slaEscalated, slaWarning, paymentFlags, noAvailableCad }) {
  if (slaBreach > 0) return "critical";
  if (slaEscalated > 0) return "warning";
  if (slaWarning > 0 || paymentFlags > 0 || noAvailableCad > 0) return "warning";
  return "ok";
}

/**
 * OPS-01 — map backend alert flags (slaBreach / slaEscalated / slaWarning /
 * paymentFlags / noAvailableCad) onto the UI contract { level, message, count }.
 * Prefers an explicit alerts.{level,message,count} envelope when the API sends one.
 */
export function normalizeOpsAlerts(root = {}, extras = {}) {
  const alertsRoot =
    root?.alerts && typeof root.alerts === "object" && !Array.isArray(root.alerts)
      ? root.alerts
      : Array.isArray(root?.alerts)
        ? { items: root.alerts }
        : {};

  const slaBreach = countAlertField(
    pickFirstDefined(alertsRoot.slaBreach, root.slaBreach, extras.slaBreach)
  );
  const slaEscalated = countAlertField(
    pickFirstDefined(alertsRoot.slaEscalated, root.slaEscalated, extras.slaEscalated)
  );
  const slaWarning = countAlertField(
    pickFirstDefined(alertsRoot.slaWarning, root.slaWarning, extras.slaWarning)
  );
  const paymentFlags = countAlertField(
    pickFirstDefined(alertsRoot.paymentFlags, root.paymentFlags, extras.paymentFlags)
  );
  const noAvailableCad = countAlertField(
    pickFirstDefined(alertsRoot.noAvailableCad, root.noAvailableCad, extras.noAvailableCad)
  );

  const derivedCount = slaBreach + slaEscalated + slaWarning + paymentFlags + noAvailableCad;
  const hasBackendFlags =
    pickFirstDefined(alertsRoot.slaBreach, root.slaBreach) !== undefined ||
    pickFirstDefined(alertsRoot.slaEscalated, root.slaEscalated) !== undefined ||
    pickFirstDefined(alertsRoot.slaWarning, root.slaWarning) !== undefined ||
    pickFirstDefined(alertsRoot.paymentFlags, root.paymentFlags) !== undefined ||
    pickFirstDefined(alertsRoot.noAvailableCad, root.noAvailableCad) !== undefined;

  const explicitLevel = String(
    alertsRoot.level ?? alertsRoot.severity ?? alertsRoot.status ?? ""
  ).toLowerCase();
  const explicitMessage = alertsRoot.message ?? alertsRoot.summary ?? null;
  const explicitCount = alertsRoot.count != null ? toNumber(alertsRoot.count) : null;

  return {
    level: explicitLevel || (hasBackendFlags || derivedCount > 0 ? deriveAlertLevel({
      slaBreach,
      slaEscalated,
      slaWarning,
      paymentFlags,
      noAvailableCad,
    }) : null),
    message:
      explicitMessage ||
      (hasBackendFlags || derivedCount > 0
        ? buildAlertMessage({
            slaBreach,
            slaEscalated,
            slaWarning,
            paymentFlags,
            noAvailableCad,
          })
        : null),
    count: explicitCount != null ? explicitCount : hasBackendFlags || derivedCount > 0 ? derivedCount : null,
    items: Array.isArray(alertsRoot.items)
      ? alertsRoot.items
      : Array.isArray(root?.alerts)
        ? root.alerts
        : [],
    slaBreach,
    slaEscalated,
    slaWarning,
    paymentFlags,
    noAvailableCad,
    raw: alertsRoot,
  };
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
  const flagsSrc =
    paymentsRoot.flags ?? paymentsRoot.flagCounts ?? root.paymentFlags ?? {};
  const paymentFlags =
    flagsSrc && typeof flagsSrc === "object" && !Array.isArray(flagsSrc)
      ? Object.entries(flagsSrc).map(([flag, count]) => ({
          flag,
          count: toNumber(count),
        }))
      : Array.isArray(flagsSrc)
        ? flagsSrc.map((row) => ({
            flag: row?.flag ?? row?.key ?? row?.name ?? "FLAG",
            count: toNumber(row?.count ?? row?.value ?? 1),
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

  const warningCount = slaItems.filter((r) => r.state === "WARNING").length;
  const escalatedCount = slaItems.filter((r) => r.state === "ESCALATED").length;
  const breachedFromItems = slaItems.filter((r) => r.state === "BREACHED" || r.breached).length;
  const slaBreached = toNumber(
    slaRoot.breached ?? root.slaBreach ?? breachedFromItems
  );
  const slaWarning = toNumber(slaRoot.warning ?? root.slaWarning ?? warningCount);
  const slaEscalated = toNumber(
    slaRoot.escalated ?? root.slaEscalated ?? escalatedCount
  );

  const paymentFlagTotal = paymentFlags.reduce((sum, row) => sum + toNumber(row.count), 0);
  const alerts = normalizeOpsAlerts(root, {
    slaBreach: slaBreached,
    slaEscalated,
    slaWarning,
    paymentFlags: paymentFlagTotal,
    noAvailableCad: root.noAvailableCad,
  });

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
      breached: slaBreached,
      warning: slaWarning,
      escalated: slaEscalated,
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
