/** M-10 — display API `sla` only; never recompute a local 48h deadline. */

export const SLA_TIMEZONE = "Asia/Kolkata";

export const SLA_STATES = Object.freeze({
  ON_TRACK: "ON_TRACK",
  WARNING: "WARNING",
  ESCALATED: "ESCALATED",
  BREACHED: "BREACHED",
  PAUSED: "PAUSED",
  MET: "MET",
  AWAITING_ASSIGNMENT: "AWAITING_ASSIGNMENT",
});

export const SLA_AWAITING_MESSAGE =
  "Deadline starts when assigned to CAD";

const STATE_LABELS = {
  ON_TRACK: "On track",
  WARNING: "Warning",
  ESCALATED: "Escalated",
  BREACHED: "Breached",
  PAUSED: "Paused",
  MET: "Met",
  AWAITING_ASSIGNMENT: "Awaiting assignment",
};

/** Ant Design Tag colors by SLA state */
const STATE_TAG_COLORS = {
  ON_TRACK: "success",
  WARNING: "warning",
  ESCALATED: "orange",
  BREACHED: "error",
  PAUSED: "default",
  MET: "blue",
  AWAITING_ASSIGNMENT: "default",
};

/**
 * Prefer `assignment.sla`, then top-level `sla` (surveyor orders).
 * @param {any} entity
 * @returns {any|null}
 */
export function pickSlaRaw(entity) {
  if (!entity || typeof entity !== "object") return null;
  const fromAssignment =
    entity.assignment && typeof entity.assignment === "object"
      ? entity.assignment.sla
      : null;
  if (fromAssignment && typeof fromAssignment === "object") return fromAssignment;
  if (entity.sla && typeof entity.sla === "object") return entity.sla;
  return null;
}

function toFiniteNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize API sla payload for UI (pass-through of authority fields).
 * @param {any} raw
 * @returns {{
 *   dueAt: string|null,
 *   state: string|null,
 *   remainingMs: number|null,
 *   remainingHours: number|null,
 *   ageHours: number|null,
 *   publicPromise: string|null,
 *   extensions: any[],
 *   raw: any,
 * } | null}
 */
export function normalizeSla(raw) {
  if (!raw || typeof raw !== "object") return null;

  const stateRaw = raw.state ?? raw.status ?? null;
  const state =
    stateRaw != null && String(stateRaw).trim() !== ""
      ? String(stateRaw).toUpperCase()
      : null;

  let remainingMs = toFiniteNumber(raw.remainingMs ?? raw.remaining_ms);
  let remainingHours = toFiniteNumber(
    raw.remainingHours ?? raw.remaining_hours ?? raw.hoursRemaining
  );
  if (remainingHours == null && remainingMs != null) {
    remainingHours = remainingMs / (1000 * 60 * 60);
  }
  if (remainingMs == null && remainingHours != null) {
    remainingMs = remainingHours * 1000 * 60 * 60;
  }

  const dueAtRaw = raw.dueAt ?? raw.due_at ?? null;
  const dueAt =
    dueAtRaw != null && String(dueAtRaw).trim() !== ""
      ? String(dueAtRaw)
      : null;

  const extensions = Array.isArray(raw.extensions)
    ? raw.extensions
    : Array.isArray(raw.extensionHistory)
      ? raw.extensionHistory
      : [];

  return {
    dueAt,
    state,
    remainingMs,
    remainingHours,
    ageHours: toFiniteNumber(raw.ageHours ?? raw.age_hours ?? raw.age),
    publicPromise:
      raw.publicPromise != null
        ? String(raw.publicPromise)
        : raw.public_promise != null
          ? String(raw.public_promise)
          : null,
    extensions,
    raw,
  };
}

/**
 * @param {any} entity
 */
export function resolveSla(entity) {
  return normalizeSla(pickSlaRaw(entity));
}

export function isSlaAwaitingAssignment(sla) {
  if (!sla) return false;
  const state = String(sla.state || "").toUpperCase();
  if (state === SLA_STATES.AWAITING_ASSIGNMENT) return true;
  return state === "" && sla.dueAt == null;
}

export function getSlaStateLabel(state) {
  const key = String(state || "").toUpperCase();
  if (!key) return "—";
  return STATE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getSlaStateTagColor(state) {
  const key = String(state || "").toUpperCase();
  return STATE_TAG_COLORS[key] || "default";
}

/**
 * Soft row highlight for WARNING / ESCALATED / BREACHED lists.
 * @returns {"warning"|"escalated"|"breached"|null}
 */
export function getSlaRiskTone(state) {
  const key = String(state || "").toUpperCase();
  if (key === SLA_STATES.WARNING) return "warning";
  if (key === SLA_STATES.ESCALATED) return "escalated";
  if (key === SLA_STATES.BREACHED) return "breached";
  return null;
}

export function formatSlaDueAt(dueAt) {
  if (dueAt == null || dueAt === "") return null;
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return String(dueAt);
  return d.toLocaleString("en-IN", {
    timeZone: SLA_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format remaining time from API fields only (no local dueAt clock).
 * @param {{ remainingMs?: number|null, remainingHours?: number|null }|null} sla
 */
export function formatSlaRemaining(sla) {
  if (!sla) return null;
  const hours = toFiniteNumber(sla.remainingHours);
  const ms = toFiniteNumber(sla.remainingMs);

  if (hours != null) {
    if (hours < 0) {
      const abs = Math.abs(hours);
      return abs >= 1
        ? `${abs.toFixed(abs >= 10 ? 0 : 1)}h overdue`
        : `${Math.round(abs * 60)}m overdue`;
    }
    if (hours >= 1) return `${hours.toFixed(hours >= 10 ? 0 : 1)}h left`;
    const mins = Math.max(0, Math.round(hours * 60));
    return `${mins}m left`;
  }

  if (ms != null) {
    const sign = ms < 0 ? -1 : 1;
    const abs = Math.abs(ms);
    const h = abs / (1000 * 60 * 60);
    const label =
      h >= 1
        ? `${h.toFixed(h >= 10 ? 0 : 1)}h`
        : `${Math.round(abs / (1000 * 60))}m`;
    return sign < 0 ? `${label} overdue` : `${label} left`;
  }

  return null;
}

export function formatSlaAgeHours(ageHours) {
  const h = toFiniteNumber(ageHours);
  if (h == null) return null;
  return `${h.toFixed(h >= 10 ? 0 : 1)}h`;
}

export function getSlaPublicPromise(sla) {
  if (sla?.publicPromise) return sla.publicPromise;
  return "48-hour delivery after CAD assignment";
}

/**
 * Ant Design Table row class helpers (tone → CSS class name).
 */
export function getSlaRowClassName(sla, prefix = "sla-row") {
  const tone = getSlaRiskTone(sla?.state);
  return tone ? `${prefix}--${tone}` : "";
}

/**
 * Normalize ops `sla.items` rows while preserving API order (risk sort).
 * @param {any[]} items
 */
export function normalizeOpsSlaItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((row, index) => {
    const nested = normalizeSla(row?.sla && typeof row.sla === "object" ? row.sla : row);
    const breachedFlag = row?.breached ?? row?.isBreached;
    let state = nested?.state ?? null;
    if (!state && breachedFlag === true) state = SLA_STATES.BREACHED;
    if (!state && breachedFlag === false) state = SLA_STATES.ON_TRACK;

    return {
      ...row,
      key: row?._id || row?.id || row?.orderId || row?.uploadId || `sla-item-${index}`,
      sla: nested
        ? { ...nested, state: state || nested.state }
        : normalizeSla({
            state,
            dueAt: row?.dueAt,
            remainingMs: row?.remainingMs,
            remainingHours: row?.remainingHours,
            ageHours: row?.ageHours ?? row?.hoursOpen ?? row?.age,
            publicPromise: row?.publicPromise,
            extensions: row?.extensions,
          }),
      state: state || nested?.state || null,
      dueAt: nested?.dueAt ?? row?.dueAt ?? null,
      remainingMs: nested?.remainingMs ?? toFiniteNumber(row?.remainingMs),
      remainingHours: nested?.remainingHours ?? toFiniteNumber(row?.remainingHours),
      ageHours:
        nested?.ageHours ??
        toFiniteNumber(row?.ageHours ?? row?.hoursOpen ?? row?.age),
      breached: breachedFlag === true || state === SLA_STATES.BREACHED,
    };
  });
}
