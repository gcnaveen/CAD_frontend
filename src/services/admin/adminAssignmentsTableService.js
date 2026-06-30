import {
  enrichSketchUploadRow,
  formatUserDisplayLabel,
  getAssignmentById,
  getAssignmentFeedback,
  lookupAssignmentIdForSketch,
  mergeAssignmentOntoSketchRow,
  resolveAssignedCadUserIdFromEntity,
  resolveAssignmentIdFromEntity,
} from "../assignmentApi.js";
import {
  extractFeedbackFromEntity,
  isFeedbackEligibleStatus,
} from "../../utils/assignmentFeedbackUtils.js";

function buildCadUserLookupMap(cadUsers) {
  const map = new Map();
  for (const user of cadUsers || []) {
    const id = user?._id ?? user?.id;
    if (id != null && String(id).trim()) {
      map.set(String(id), user);
    }
  }
  return map;
}

/** CAD user id from assignment fields or latest delivery record. */
export function resolveCadUserIdFromSketchRow(row) {
  const fromAssignment = resolveAssignedCadUserIdFromEntity(row);
  if (fromAssignment) return fromAssignment;

  const history = row?.cadDeliverableHistory;
  if (Array.isArray(history) && history.length) {
    const latest = history[history.length - 1];
    const submittedBy = latest?.submittedBy;
    if (submittedBy != null && String(submittedBy).trim()) {
      return String(submittedBy);
    }
  }

  return null;
}

export function resolveAssignedCadUserLabel(row, cadUserById) {
  const direct =
    formatUserDisplayLabel(row?.assignedCadUser) ||
    formatUserDisplayLabel(row?.assignment?.cadUser) ||
    formatUserDisplayLabel(row?.assignment?.assignedTo) ||
    formatUserDisplayLabel(row?.assignment?.assignedCadUser) ||
    formatUserDisplayLabel(row?.assignment?.cadCenter) ||
    formatUserDisplayLabel(row?.assignment?.cadCenterId) ||
    formatUserDisplayLabel(row?.cadCenterId) ||
    formatUserDisplayLabel(row?.cadCenter) ||
    formatUserDisplayLabel(row?.assignedCadCenterId) ||
    formatUserDisplayLabel(row?.assignedTo);

  if (direct) return direct;

  const cadUserId = resolveCadUserIdFromSketchRow(row);
  if (!cadUserId) return "";

  const matched = cadUserById.get(String(cadUserId));
  if (matched) {
    return formatUserDisplayLabel(matched) || String(cadUserId);
  }

  return String(cadUserId);
}

async function resolveAssignmentForRow(row) {
  const uploadId = row?._id ?? row?.id;
  if (!uploadId) return row;

  const uploadKey = String(uploadId);
  let enriched = await enrichSketchUploadRow(row);

  let assignmentId = resolveAssignmentIdFromEntity(enriched);
  if (!assignmentId || assignmentId === uploadKey) {
    const cadHint = resolveCadUserIdFromSketchRow(enriched);
    assignmentId = await lookupAssignmentIdForSketch(uploadKey, cadHint);
    if (assignmentId && assignmentId !== uploadKey) {
      enriched = mergeAssignmentOntoSketchRow(enriched, { _id: assignmentId });
    }
  }

  assignmentId = resolveAssignmentIdFromEntity(enriched);
  if (
    assignmentId &&
    assignmentId !== uploadKey &&
    !formatUserDisplayLabel(enriched?.assignment?.cadUser) &&
    !resolveAssignedCadUserIdFromEntity(enriched)
  ) {
    try {
      const assignment = await getAssignmentById(assignmentId);
      if (assignment) {
        enriched = {
          ...enriched,
          assignmentId: String(assignmentId),
          assignment: assignment,
        };
      }
    } catch {
      // assignment detail optional
    }
  }

  return enriched;
}

async function attachFeedbackToRow(row) {
  const embedded = extractFeedbackFromEntity(row);
  if (embedded) {
    return { ...row, feedback: embedded };
  }

  if (!isFeedbackEligibleStatus(row?.status)) {
    return row;
  }

  const uploadKey = String(row?._id ?? row?.id ?? "");
  const assignmentId = resolveAssignmentIdFromEntity(row);
  if (!assignmentId || assignmentId === uploadKey) {
    return row;
  }

  try {
    const feedback = await getAssignmentFeedback(assignmentId);
    if (!feedback) return row;
    return { ...row, feedback };
  } catch {
    return row;
  }
}

/**
 * Enrich list rows with assignment id, CAD user label, and feedback for admin table.
 */
export async function enrichAdminAssignmentTableRows(rows, cadUsers = []) {
  if (!Array.isArray(rows) || !rows.length) return [];

  const cadUserById = buildCadUserLookupMap(cadUsers);

  const withAssignment = await Promise.all(
    rows.map(async (row) => {
      try {
        const enriched = await resolveAssignmentForRow(row);
        const assignedCadUserLabel = resolveAssignedCadUserLabel(enriched, cadUserById);
        return { ...enriched, assignedCadUserLabel };
      } catch {
        return {
          ...row,
          assignedCadUserLabel: resolveAssignedCadUserLabel(row, cadUserById),
        };
      }
    })
  );

  return Promise.all(withAssignment.map((row) => attachFeedbackToRow(row)));
}

export function extractUploadsListResponse(payload) {
  let uploads = [];
  let metaSource = payload;

  if (Array.isArray(payload?.data)) {
    uploads = payload.data;
    metaSource = payload;
  } else if (Array.isArray(payload)) {
    uploads = payload;
    metaSource = {};
  } else {
    const root = payload?.data ?? payload;
    if (Array.isArray(root)) {
      uploads = root;
    } else if (Array.isArray(root?.uploads)) {
      uploads = root.uploads;
      metaSource = root;
    } else if (Array.isArray(root?.items)) {
      uploads = root.items;
      metaSource = root;
    } else if (Array.isArray(root?.results)) {
      uploads = root.results;
      metaSource = root;
    } else if (Array.isArray(root?.data)) {
      uploads = root.data;
      metaSource = root;
    }
  }

  const metaRoot = metaSource?.meta ?? metaSource?.pagination ?? metaSource ?? {};
  const pager =
    metaRoot?.pagination && typeof metaRoot.pagination === "object"
      ? metaRoot.pagination
      : metaRoot;

  const limit = Number(pager?.limit ?? metaRoot?.limit ?? pager?.perPage ?? 10) || 10;
  const page = Number(pager?.page ?? metaRoot?.page ?? pager?.currentPage ?? 1) || 1;
  const total =
    Number(pager?.total ?? metaRoot?.total ?? pager?.totalItems ?? pager?.count ?? uploads.length) ||
    uploads.length;
  const totalPages =
    Number(pager?.totalPages ?? metaRoot?.totalPages ?? pager?.pages ?? Math.ceil(total / limit)) ||
    Math.max(1, Math.ceil(total / limit));

  return {
    uploads,
    meta: { page, limit, total, totalPages },
  };
}
