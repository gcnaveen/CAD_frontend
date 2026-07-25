/**
 * M-09 — Auto-assign manual-gate helpers (pure, no API client).
 */

export const MANUAL_GATE_REASONS = Object.freeze({
  AUTO_ASSIGN_OFF: "AUTO_ASSIGN_OFF",
  EXCEPTION_QUEUE: "EXCEPTION_QUEUE",
  OVERRIDE_TIMEOUT: "OVERRIDE_TIMEOUT",
  AUTO_ASSIGN_ACTIVE: "AUTO_ASSIGN_ACTIVE",
  ALREADY_ASSIGNED: "ALREADY_ASSIGNED",
});

function unwrapData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function toNumber(value, fallback = null) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize GET /api/admin/survey-sketch-assignment-flow payload.
 * @param {any} raw
 */
export function normalizeAssignmentFlow(raw) {
  const root = unwrapData(raw) ?? {};
  const nested = root?.data && typeof root.data === "object" ? root.data : root;
  const policySrc =
    (nested?.policy && typeof nested.policy === "object" ? nested.policy : null) ??
    (root?.policy && typeof root.policy === "object" ? root.policy : null) ??
    {};

  const enabled =
    nested?.autoAssignEnabled ??
    nested?.enabled ??
    nested?.isAuto ??
    nested?.auto ??
    nested?.autoAssign ??
    root?.autoAssignEnabled ??
    false;

  return {
    autoAssignEnabled: Boolean(enabled),
    policy: {
      maxAttempts: toNumber(policySrc.maxAttempts),
      retryBaseMs: toNumber(policySrc.retryBaseMs),
      manualOverrideMs: toNumber(policySrc.manualOverrideMs),
      ...policySrc,
    },
    exceptionQueueTotal: toNumber(
      nested?.exceptionQueueTotal ?? root?.exceptionQueueTotal,
      0
    ),
    manualAssignHint: String(
      nested?.manualAssignHint ?? root?.manualAssignHint ?? ""
    ).trim(),
    raw: nested,
  };
}

/**
 * Normalize manual-gate response.
 * @param {any} raw
 */
export function normalizeManualAssignGate(raw) {
  const root = unwrapData(raw) ?? {};
  const reason = String(
    root.reason ?? root.code ?? root.gate ?? root.status ?? ""
  )
    .trim()
    .toUpperCase();

  return {
    allowed: root.allowed === true,
    reason: reason || null,
    manualOverrideAllowedAt:
      root.manualOverrideAllowedAt ??
      root.overrideAllowedAt ??
      root.errors?.[0]?.manualOverrideAllowedAt ??
      null,
    message: root.message ?? root.errors?.[0]?.message ?? null,
    raw: root,
  };
}

/**
 * UI decision for the Assign control on a PENDING row.
 * @param {ReturnType<typeof normalizeManualAssignGate> | null | undefined} gate
 */
export function resolveManualAssignUi(gate) {
  if (!gate) {
    return {
      showAssign: false,
      disabled: true,
      loading: true,
      badge: null,
      hint: null,
    };
  }

  const reason = String(gate.reason || "").toUpperCase();

  if (reason === MANUAL_GATE_REASONS.ALREADY_ASSIGNED) {
    return {
      showAssign: false,
      disabled: false,
      loading: false,
      badge: null,
      hint: null,
    };
  }

  if (gate.allowed === false && reason === MANUAL_GATE_REASONS.AUTO_ASSIGN_ACTIVE) {
    return {
      showAssign: true,
      disabled: true,
      loading: false,
      badge: null,
      hint: formatAutoAssignActiveHint(gate.manualOverrideAllowedAt),
    };
  }

  if (
    gate.allowed === true &&
    (reason === MANUAL_GATE_REASONS.EXCEPTION_QUEUE ||
      reason === MANUAL_GATE_REASONS.OVERRIDE_TIMEOUT)
  ) {
    return {
      showAssign: true,
      disabled: false,
      loading: false,
      badge: "Needs manual assign",
      hint: null,
    };
  }

  if (gate.allowed === true) {
    return {
      showAssign: true,
      disabled: false,
      loading: false,
      badge: null,
      hint: null,
    };
  }

  return {
    showAssign: true,
    disabled: true,
    loading: false,
    badge: null,
    hint: gate.message || "Manual assign not available yet",
  };
}

/**
 * @param {string | Date | null | undefined} at
 */
export function formatOverrideAt(at) {
  if (!at) return null;
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) return String(at);
  return d.toLocaleString();
}

/**
 * @param {string | Date | null | undefined} at
 */
export function formatAutoAssignActiveHint(at) {
  const formatted = formatOverrideAt(at);
  if (formatted) return `Auto-assigning… override at ${formatted}`;
  return "Auto-assigning…";
}

/**
 * Parse MANUAL_ASSIGN_BLOCKED from create-assignment (or similar) errors.
 * Prefer errors[0].manualOverrideAllowedAt.
 * @param {any} error
 */
export function parseManualAssignBlocked(error) {
  const body = error?.data ?? error?.response?.data ?? null;
  const first = Array.isArray(body?.errors) ? body.errors[0] : null;
  const code = String(
    first?.code ?? body?.code ?? body?.error ?? body?.errorCode ?? ""
  ).toUpperCase();
  const messageText = String(
    first?.message ?? body?.message ?? error?.message ?? ""
  );
  const blocked =
    code === "MANUAL_ASSIGN_BLOCKED" ||
    messageText.includes("MANUAL_ASSIGN_BLOCKED");

  const manualOverrideAllowedAt =
    first?.manualOverrideAllowedAt ??
    body?.manualOverrideAllowedAt ??
    body?.overrideAllowedAt ??
    null;

  return {
    blocked,
    code: blocked ? "MANUAL_ASSIGN_BLOCKED" : code || null,
    manualOverrideAllowedAt,
    message: blocked
      ? formatManualAssignBlockedMessage(manualOverrideAllowedAt, messageText)
      : messageText || null,
  };
}

/**
 * @param {string | Date | null | undefined} at
 * @param {string} [fallbackMessage]
 */
export function formatManualAssignBlockedMessage(at, fallbackMessage = "") {
  const formatted = formatOverrideAt(at);
  if (formatted) {
    return `Manual assign blocked until override at ${formatted}`;
  }
  const cleaned = String(fallbackMessage || "")
    .replace(/MANUAL_ASSIGN_BLOCKED/gi, "")
    .trim();
  return cleaned || "Manual assign is temporarily blocked by auto-assign";
}

/**
 * Normalize exceptions list response.
 * @param {any} raw
 */
export function normalizeAutoAssignExceptions(raw) {
  const root = unwrapData(raw) ?? raw ?? {};
  const list = Array.isArray(root)
    ? root
    : Array.isArray(root.items)
      ? root.items
      : Array.isArray(root.exceptions)
        ? root.exceptions
        : Array.isArray(root.results)
          ? root.results
          : Array.isArray(root.data)
            ? root.data
            : [];

  const metaSrc = root.meta ?? root.pagination ?? {};
  const items = list.map((row) => normalizeExceptionRow(row));

  return {
    items,
    meta: {
      page: toNumber(metaSrc.page, 1) || 1,
      limit: toNumber(metaSrc.limit, items.length || 10) || 10,
      total: toNumber(metaSrc.total, items.length) || items.length,
      totalPages:
        toNumber(metaSrc.totalPages) ||
        Math.max(
          1,
          Math.ceil(
            (toNumber(metaSrc.total, items.length) || items.length) /
              (toNumber(metaSrc.limit, items.length || 10) || 10)
          )
        ),
    },
  };
}

function normalizeExceptionRow(row) {
  if (!row || typeof row !== "object") {
    return {
      uploadId: null,
      applicationId: null,
      status: null,
      failureReason: null,
      raw: row,
    };
  }
  const upload =
    row.surveyorSketchUpload && typeof row.surveyorSketchUpload === "object"
      ? row.surveyorSketchUpload
      : null;
  const uploadId =
    row.uploadId ??
    row.surveyorSketchUploadId ??
    upload?._id ??
    upload?.id ??
    row._id ??
    row.id ??
    null;

  return {
    uploadId: uploadId != null ? String(uploadId) : null,
    applicationId:
      row.applicationId ?? upload?.applicationId ?? row.application_id ?? null,
    status: row.status ?? row.queueStatus ?? row.state ?? null,
    failureReason:
      row.failureReason ??
      row.reason ??
      row.lastFailureReason ??
      row.errorMessage ??
      row.message ??
      null,
    lastAttemptAt:
      row.lastAttemptAt ?? row.updatedAt ?? row.failedAt ?? row.createdAt ?? null,
    attemptCount: toNumber(row.attemptCount ?? row.attempts ?? row.retryCount),
    manualOverrideAllowedAt: row.manualOverrideAllowedAt ?? null,
    raw: row,
  };
}

/**
 * Normalize attempts audit list.
 * @param {any} raw
 */
export function normalizeAutoAssignAttempts(raw) {
  const root = unwrapData(raw) ?? raw ?? {};
  const list = Array.isArray(root)
    ? root
    : Array.isArray(root.attempts)
      ? root.attempts
      : Array.isArray(root.items)
        ? root.items
        : Array.isArray(root.data)
          ? root.data
          : [];

  return list.map((row, index) => ({
    id: row?._id ?? row?.id ?? `attempt-${index}`,
    attemptNumber: toNumber(row?.attemptNumber ?? row?.n ?? row?.index, index + 1),
    status: row?.status ?? row?.result ?? null,
    failureReason:
      row?.failureReason ?? row?.reason ?? row?.errorMessage ?? row?.message ?? null,
    createdAt: row?.createdAt ?? row?.attemptedAt ?? row?.at ?? null,
    cadUserId:
      row?.assignedCadUserId ?? row?.cadUserId ?? row?.candidateCadUserId ?? null,
    raw: row,
  }));
}
