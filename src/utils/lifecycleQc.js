/**
 * M-08 Lifecycle & QC — single source for labels, analytics, notifications, site copy.
 * Prefer GET /api/public/business-rules → lifecycleMachine + qc;
 * fallback: docs/LIFECYCLE_QC_SPEC_M08.json (same content).
 */

import LIFECYCLE_QC_SPEC from "../../docs/LIFECYCLE_QC_SPEC_M08.json";

/** @typedef {{
 *   code: string,
 *   label: string,
 * }} SketchStatusDef */

/** @typedef {{
 *   labels: Record<string, string>,
 *   sketchStatuses: SketchStatusDef[],
 *   legacySketchStatusMap: Record<string, string>,
 *   notificationTriggers: string[],
 *   analyticsKeys: string[],
 * }} LifecycleMachine */

/** @typedef {{
 *   checkCount: number,
 *   checklistId: string,
 *   expressSameChecklist: boolean,
 *   approvedCopy: string,
 *   expressCopy: string,
 *   includedBullet: string,
 *   statValue: string,
 *   statLabel: string,
 * }} QcRules */

const SPEC = LIFECYCLE_QC_SPEC;

/** Frozen fallback matching the committed M-08 snapshot. */
export const FALLBACK_LIFECYCLE_MACHINE = Object.freeze(
  structuredClone(SPEC.lifecycleMachine)
);

/** Frozen fallback QC block (checkCount must remain 10). */
export const FALLBACK_QC = Object.freeze(structuredClone(SPEC.qc));

const CANONICAL_CODES = Object.freeze(
  Object.keys(FALLBACK_LIFECYCLE_MACHINE.labels)
);

/**
 * @param {any} raw
 * @returns {LifecycleMachine}
 */
export function normalizeLifecycleMachine(raw) {
  const fb = FALLBACK_LIFECYCLE_MACHINE;
  const r = raw && typeof raw === "object" ? raw : {};

  const labelsIn =
    r.labels && typeof r.labels === "object" && !Array.isArray(r.labels)
      ? r.labels
      : null;

  /** @type {SketchStatusDef[]} */
  let sketchStatuses = [];
  if (Array.isArray(r.sketchStatuses) && r.sketchStatuses.length) {
    sketchStatuses = r.sketchStatuses
      .map((s) => {
        const code = String(s?.code ?? s?.value ?? s?.status ?? "")
          .trim()
          .toUpperCase();
        if (!code) return null;
        const label =
          (s?.label != null && String(s.label).trim()) ||
          (labelsIn?.[code] != null && String(labelsIn[code]).trim()) ||
          fb.labels[code] ||
          code;
        return { code, label };
      })
      .filter(Boolean);
  }

  /** @type {Record<string, string>} */
  const labels = { ...fb.labels };
  if (labelsIn) {
    for (const [k, v] of Object.entries(labelsIn)) {
      const code = String(k).trim().toUpperCase();
      if (!code || v == null || String(v).trim() === "") continue;
      labels[code] = String(v).trim();
    }
  }
  for (const s of sketchStatuses) {
    if (s.label) labels[s.code] = s.label;
  }

  if (!sketchStatuses.length) {
    sketchStatuses = Object.entries(labels).map(([code, label]) => ({
      code,
      label,
    }));
  }

  const legacyIn =
    r.legacySketchStatusMap && typeof r.legacySketchStatusMap === "object"
      ? r.legacySketchStatusMap
      : {};
  /** @type {Record<string, string>} */
  const legacySketchStatusMap = { ...fb.legacySketchStatusMap };
  for (const [k, v] of Object.entries(legacyIn)) {
    const from = String(k).trim().toUpperCase();
    const to = String(v ?? "")
      .trim()
      .toUpperCase();
    if (from && to) legacySketchStatusMap[from] = to;
  }

  const notificationTriggers = Array.isArray(r.notificationTriggers)
    ? r.notificationTriggers.map(String).filter(Boolean)
    : [...fb.notificationTriggers];

  const analyticsKeys = Array.isArray(r.analyticsKeys)
    ? r.analyticsKeys.map(String).filter(Boolean)
    : [...fb.analyticsKeys];

  return {
    labels,
    sketchStatuses,
    legacySketchStatusMap,
    notificationTriggers,
    analyticsKeys,
  };
}

/**
 * @param {any} raw
 * @returns {QcRules}
 */
export function normalizeQc(raw) {
  const fb = FALLBACK_QC;
  const r = raw && typeof raw === "object" ? raw : {};
  const checkCount = Number(r.checkCount);
  return {
    checkCount: checkCount === 10 ? 10 : fb.checkCount,
    checklistId:
      r.checklistId != null && String(r.checklistId).trim() !== ""
        ? String(r.checklistId).trim()
        : fb.checklistId,
    expressSameChecklist:
      r.expressSameChecklist == null
        ? fb.expressSameChecklist
        : Boolean(r.expressSameChecklist),
    approvedCopy:
      r.approvedCopy != null && String(r.approvedCopy).trim() !== ""
        ? String(r.approvedCopy).trim()
        : fb.approvedCopy,
    expressCopy:
      r.expressCopy != null && String(r.expressCopy).trim() !== ""
        ? String(r.expressCopy).trim()
        : fb.expressCopy,
    includedBullet:
      r.includedBullet != null && String(r.includedBullet).trim() !== ""
        ? String(r.includedBullet).trim()
        : fb.includedBullet,
    statValue:
      r.statValue != null && String(r.statValue).trim() !== ""
        ? String(r.statValue).trim()
        : String(checkCount === 10 ? 10 : fb.checkCount),
    statLabel:
      r.statLabel != null && String(r.statLabel).trim() !== ""
        ? String(r.statLabel).trim()
        : fb.statLabel,
  };
}

/**
 * Map legacy UI/API values (e.g. UNDER_REVIEW → UNDER_REVISION).
 * @param {string | null | undefined} apiStatus
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function canonicalizeSketchStatus(apiStatus, machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  const raw = String(apiStatus || "")
    .trim()
    .toUpperCase();
  if (!raw) return "";
  return m.legacySketchStatusMap[raw] || raw;
}

/**
 * Label from lifecycleMachine.labels / sketchStatuses[].label only.
 * @param {string | null | undefined} apiStatus
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function getSketchStatusLabel(apiStatus, machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  const code = canonicalizeSketchStatus(apiStatus, m);
  if (!code) return m.labels.PENDING || "Queued for assignment";
  return m.labels[code] || code;
}

/**
 * @param {LifecycleMachine | null | undefined} [machine]
 * @returns {string[]}
 */
export function getSketchStatusCodes(machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  if (m.sketchStatuses?.length) return m.sketchStatuses.map((s) => s.code);
  return [...CANONICAL_CODES];
}

/**
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function getNotificationTriggers(machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  return [...m.notificationTriggers];
}

/**
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function getAnalyticsKeys(machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  return [...m.analyticsKeys];
}

/**
 * Resolve analytics key for a status from payload analyticsKeys (no parallel FE enums).
 * Prefer keys ending with `.<status_lower>`; else positional match against sketchStatuses.
 * @param {string | null | undefined} apiStatus
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function analyticsKeyForStatus(apiStatus, machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  const code = canonicalizeSketchStatus(apiStatus, m);
  if (!code) return null;
  const needle = `.${code.toLowerCase()}`;
  const bySuffix = m.analyticsKeys.find((k) => String(k).toLowerCase().endsWith(needle));
  if (bySuffix) return bySuffix;
  const idx = m.sketchStatuses.findIndex((s) => s.code === code);
  if (idx >= 0 && m.analyticsKeys[idx]) return m.analyticsKeys[idx];
  return null;
}

/**
 * Resolve notification trigger for a status from payload notificationTriggers.
 * @param {string | null | undefined} apiStatus
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function notificationTriggerForStatus(apiStatus, machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  const code = canonicalizeSketchStatus(apiStatus, m);
  if (!code) return null;
  const lower = code.toLowerCase();
  const compact = lower.replace(/_/g, "");
  const byInclude = m.notificationTriggers.find((k) => {
    const t = String(k).toLowerCase();
    return t.includes(lower) || t.includes(compact);
  });
  if (byInclude) return byInclude;
  const idx = m.sketchStatuses.findIndex((s) => s.code === code);
  if (idx >= 0 && m.notificationTriggers[idx]) return m.notificationTriggers[idx];
  return null;
}

/**
 * @param {string | null | undefined} trigger
 * @param {LifecycleMachine | null | undefined} [machine]
 */
export function isKnownNotificationTrigger(trigger, machine) {
  const m = machine ? normalizeLifecycleMachine(machine) : FALLBACK_LIFECYCLE_MACHINE;
  const t = String(trigger || "").trim();
  if (!t) return false;
  return m.notificationTriggers.includes(t);
}

/**
 * @param {QcRules | null | undefined} [qc]
 */
export function getQcApprovedCopy(qc) {
  return normalizeQc(qc).approvedCopy;
}

/**
 * @param {QcRules | null | undefined} [qc]
 */
export function getQcIncludedBullet(qc) {
  return normalizeQc(qc).includedBullet;
}

/**
 * Admin GET /api/admin/survey-sketch-statuses normalizer.
 * Returns enums, labels, transitions, and QC for ops tools.
 * @param {any} raw
 */
export function normalizeSurveySketchStatusesPayload(raw) {
  const envelope = raw?.data ?? raw ?? {};
  const root =
    envelope?.statuses != null ||
    envelope?.sketchStatuses != null ||
    envelope?.lifecycleMachine != null ||
    Array.isArray(envelope)
      ? envelope
      : envelope?.data ?? envelope;

  const machine = normalizeLifecycleMachine(
    root?.lifecycleMachine ?? {
      labels: root?.labels,
      sketchStatuses: root?.sketchStatuses ?? root?.statuses,
      legacySketchStatusMap: root?.legacySketchStatusMap,
      notificationTriggers: root?.notificationTriggers,
      analyticsKeys: root?.analyticsKeys,
    }
  );

  const qc = normalizeQc(root?.qc);

  /** @type {{ value: string, label: string }[]} */
  let statuses = [];
  const list = Array.isArray(root)
    ? root
    : root?.statuses ?? root?.sketchStatuses ?? machine.sketchStatuses;

  if (Array.isArray(list)) {
    statuses = list
      .map((s) => {
        if (typeof s === "string") {
          const code = canonicalizeSketchStatus(s, machine);
          return { value: code, label: getSketchStatusLabel(code, machine) };
        }
        const code = canonicalizeSketchStatus(
          s?.value ?? s?.code ?? s?.status ?? s?.key,
          machine
        );
        if (!code) return null;
        const label =
          (s?.label != null && String(s.label).trim()) ||
          getSketchStatusLabel(code, machine);
        return { value: code, label };
      })
      .filter(Boolean);
  }

  if (!statuses.length) {
    statuses = machine.sketchStatuses.map((s) => ({
      value: s.code,
      label: s.label,
    }));
  }

  const transitions =
    root?.transitions && typeof root.transitions === "object"
      ? root.transitions
      : root?.allowedTransitions && typeof root.allowedTransitions === "object"
        ? root.allowedTransitions
        : {};

  return {
    statuses,
    labels: machine.labels,
    transitions,
    qc,
    lifecycleMachine: machine,
    legacySketchStatusMap: machine.legacySketchStatusMap,
    notificationTriggers: machine.notificationTriggers,
    analyticsKeys: machine.analyticsKeys,
  };
}
