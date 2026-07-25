import apiClient from "./apiClient.js";
import { getSketchUploadById } from "./surveyor/sketchUploadService.js";
import { normalizeSurveySketchStatusesPayload } from "../utils/lifecycleQc.js";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  const status = error.response?.status;
  const err = new Error(message);
  err.status = status;
  err.data = error.response?.data;
  throw err;
}

function unwrapData(payload) {
  // Backend responses in this app are sometimes { success, data } and sometimes direct arrays/objects.
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

/**
 * GET /api/users can return { success, data: { items, meta } }, a bare array, or legacy shapes.
 */
export function normalizeUserListFromApi(responseBody) {
  const root = unwrapData(responseBody);
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.users)) return root.users;
  if (Array.isArray(root?.results)) return root.results;
  if (Array.isArray(root?.data)) return root.data;
  return [];
}

export function filterCadRoleUsers(users) {
  return (users || []).filter((u) => String(u?.role || "").toUpperCase() === "CAD");
}

/**
 * Safe label for selects / table cells. API returns name as { first, last }.
 */
/**
 * Resolve survey sketch assignment id from upload row or API detail object.
 */
export function resolveAssignmentIdFromEntity(entity) {
  if (!entity || typeof entity !== "object") return null;

  if (entity.surveyorSketchUpload != null) {
    const assignmentId = entity._id ?? entity.id;
    const upload = entity.surveyorSketchUpload;
    const uploadId = typeof upload === "object" && upload != null ? upload._id ?? upload.id : upload;
    if (assignmentId != null && String(assignmentId).trim() !== "") {
      if (!uploadId || String(assignmentId) !== String(uploadId)) {
        return String(assignmentId);
      }
    }
  }

  const a = entity.assignment;
  if (a && typeof a === "object") {
    const id = a._id ?? a.id;
    if (id != null && String(id).trim() !== "") return String(id);
  }
  if (typeof a === "string" && a.trim() !== "") return a.trim();
  if (entity.assignmentId != null && String(entity.assignmentId).trim() !== "") {
    return String(entity.assignmentId);
  }
  for (const key of ["activeAssignmentId", "latestAssignmentId", "currentAssignmentId"]) {
    if (entity[key] != null && String(entity[key]).trim() !== "") {
      return String(entity[key]);
    }
  }
  for (const key of ["cadAssignment", "currentAssignment", "latestAssignment", "surveySketchAssignment"]) {
    const val = entity[key];
    if (typeof val === "string" && val.trim()) {
      const id = val.trim();
      const uploadId = entity._id ?? entity.id;
      if (!uploadId || String(id) !== String(uploadId)) return id;
    }
    if (val && typeof val === "object") {
      const id = val._id ?? val.id;
      if (id != null && String(id).trim() !== "") return String(id);
    }
  }
  for (const key of ["surveySketchAssignmentId", "cadAssignmentId"]) {
    if (entity[key] != null && String(entity[key]).trim() !== "") {
      return String(entity[key]);
    }
  }
  return null;
}

const SKETCH_ASSIGNMENT_ID_CACHE_KEY = "cad_sketch_assignment_id_map";

function readAssignmentIdCache() {
  try {
    const raw = sessionStorage.getItem(SKETCH_ASSIGNMENT_ID_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function cacheAssignmentIdForSketch(uploadId, assignmentId) {
  if (uploadId == null || assignmentId == null) return;
  const uploadKey = String(uploadId).trim();
  const assignmentKey = String(assignmentId).trim();
  if (!uploadKey || !assignmentKey || uploadKey === assignmentKey) return;
  const map = readAssignmentIdCache();
  map[uploadKey] = assignmentKey;
  sessionStorage.setItem(SKETCH_ASSIGNMENT_ID_CACHE_KEY, JSON.stringify(map));
}

function getCachedAssignmentIdForSketch(uploadId) {
  const id = readAssignmentIdCache()[String(uploadId)];
  return id != null && String(id).trim() !== "" ? String(id) : null;
}

function parseAssignmentFromApiBody(body) {
  if (!body || typeof body !== "object") return null;
  const nested =
    body.assignment ??
    body.existingAssignment ??
    body.existing ??
    body.conflict ??
    (body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data : null);
  if (nested && typeof nested === "object" && (nested._id || nested.id)) return nested;
  const assignmentId =
    body.assignmentId ??
    body.data?.assignmentId ??
    body.existingAssignmentId ??
    body.conflictAssignmentId;
  if (assignmentId != null && String(assignmentId).trim() !== "") {
    return { _id: String(assignmentId) };
  }
  return null;
}

function findAssignmentInConflictBody(body, uploadId) {
  const direct = parseAssignmentFromApiBody(body);
  if (direct?._id || direct?.id) return direct;

  const walk = (node, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 6) return null;
    if ((node._id || node.id) && (node.status != null || node.surveyorSketchUpload != null)) {
      const upload = node.surveyorSketchUpload;
      const uploadKey =
        typeof upload === "object" && upload != null ? upload._id ?? upload.id : upload;
      if (!uploadId || !uploadKey || String(uploadKey) === String(uploadId)) return node;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const value of Object.values(node)) {
      const found = walk(value, depth + 1);
      if (found) return found;
    }
    return null;
  };

  return walk(body);
}

/** Map UI payload to POST /api/admin/survey-sketch-assignments body. */
export function buildCreateAssignmentPayload(payload = {}) {
  const surveyorSketchUploadId = payload.surveyorSketchUploadId ?? payload.sketchUploadId;
  const assignedCadUserId =
    payload.assignedCadUserId ??
    payload.cadUserId ??
    payload.assignedToUserId ??
    payload.cadCenterId;
  const body = { surveyorSketchUploadId };
  if (assignedCadUserId) body.assignedCadUserId = String(assignedCadUserId);
  // M-10: client dueDate is ignored for SLA authority — do not send.
  if (payload.notes != null) body.notes = payload.notes;
  return body;
}

function findEmbeddedAssignmentInDetail(detail, uploadId) {
  if (!detail || typeof detail !== "object") return null;

  const walk = (node, depth = 0) => {
    if (!node || typeof node !== "object" || depth > 6) return null;
    if ((node._id || node.id) && node.surveyorSketchUpload != null) {
      const upload = node.surveyorSketchUpload;
      const uploadKey =
        typeof upload === "object" && upload != null ? upload._id ?? upload.id : upload;
      if (uploadKey && String(uploadKey) === String(uploadId)) return node;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    for (const value of Object.values(node)) {
      const found = walk(value, depth + 1);
      if (found) return found;
    }
    return null;
  };

  return walk(detail);
}

async function probeAssignmentIdFromPost(uploadId, assignedCadUserId) {
  if (!uploadId || !assignedCadUserId) return null;
  const uploadKey = String(uploadId);

  try {
    const { data } = await apiClient.post("/api/admin/survey-sketch-assignments", {
      surveyorSketchUploadId: uploadKey,
      assignedCadUserId: String(assignedCadUserId),
    });
    const assignment = unwrapData(data);
    const assignmentId = assignment?._id ?? assignment?.id;
    if (assignmentId) {
      cacheAssignmentIdForSketch(uploadKey, assignmentId);
      return String(assignmentId);
    }
  } catch (error) {
    if (error.response?.status === 409) {
      const existing =
        findAssignmentInConflictBody(error.response?.data, uploadKey) ??
        parseAssignmentFromApiBody(error.response?.data);
      const assignmentId = existing?._id ?? existing?.id;
      if (assignmentId) {
        cacheAssignmentIdForSketch(uploadKey, assignmentId);
        return String(assignmentId);
      }
    }
  }

  return null;
}

export function mergeAssignmentOntoSketchRow(row, assignmentRecord) {
  const assignmentId = assignmentRecord?._id ?? assignmentRecord?.id;
  const uploadId = row?._id ?? row?.id;
  if (uploadId && assignmentId) {
    cacheAssignmentIdForSketch(uploadId, assignmentId);
  }
  return {
    ...row,
    assignmentId: assignmentId ? String(assignmentId) : row.assignmentId,
    assignment: assignmentRecord ?? row.assignment,
  };
}

/**
 * Ensure a sketch upload row has assignmentId (from row, cache, or sketch detail API).
 */
export async function enrichSketchUploadRow(row) {
  if (!row || typeof row !== "object") return row;

  const uploadId = row._id ?? row.id;
  if (!uploadId) return row;

  let assignmentId = resolveAssignmentIdFromEntity(row);
  if (assignmentId && assignmentId !== String(uploadId)) {
    return row;
  }

  const cached = getCachedAssignmentIdForSketch(uploadId);
  if (cached) {
    return mergeAssignmentOntoSketchRow(row, { _id: cached });
  }

  try {
    const res = await getSketchUploadById(uploadId);
    const detail = res?.data;
    if (detail) {
      assignmentId = resolveAssignmentIdFromEntity(detail);
      if (!assignmentId || assignmentId === String(uploadId)) {
        const embedded = findEmbeddedAssignmentInDetail(detail, uploadId);
        assignmentId = embedded?._id ?? embedded?.id ?? null;
        if (embedded) {
          return mergeAssignmentOntoSketchRow({ ...row, ...detail }, embedded);
        }
      }
      if (assignmentId && assignmentId !== String(uploadId)) {
        const assignment =
          detail.assignment && typeof detail.assignment === "object"
            ? detail.assignment
            : { _id: assignmentId };
        return mergeAssignmentOntoSketchRow({ ...row, ...detail }, assignment);
      }
    }
  } catch {
    // no detail available
  }

  return row;
}

const PULLBACK_ASSIGNMENT_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS", "ON_HOLD"]);

const SKETCH_STATUS_FALLBACK_FOR_PULLBACK = new Set([
  "ASSIGNED",
  "UNDER_REVIEW",
  "UNDER_REVISION",
  "IN_PROGRESS",
  "ON_HOLD",
  "NEED_CHANGES",
]);

export function resolveAssignmentStatusFromEntity(entity) {
  const a = entity?.assignment;
  if (a && typeof a === "object" && a.status != null) return String(a.status).toUpperCase();
  if (entity?.assignmentStatus != null) return String(entity.assignmentStatus).toUpperCase();
  return "";
}

/** Whether admin can pull back and reassign this sketch upload row. */
export function canPullbackSketchEntity(entity) {
  if (!entity) return false;
  const assignmentSt = resolveAssignmentStatusFromEntity(entity);
  if (PULLBACK_ASSIGNMENT_STATUSES.has(assignmentSt)) return true;

  const stUp = String(entity?.status || "").toUpperCase();
  if (PULLBACK_ASSIGNMENT_STATUSES.has(stUp)) return true;
  return SKETCH_STATUS_FALLBACK_FOR_PULLBACK.has(stUp);
}

export async function resolveAssignmentIdForSketch(sketch) {
  const enriched = await enrichSketchUploadRow(sketch);
  return resolveAssignmentIdFromEntity(enriched);
}

export function resolveCadCenterIdFromEntity(entity) {
  return resolveAssignedCadUserIdFromEntity(entity);
}

export function resolveAssignedCadUserIdFromEntity(entity) {
  if (!entity || typeof entity !== "object") return null;
  for (const key of [
    "assignedCadUserId",
    "cadUserId",
    "assignedToUserId",
    "assignedCadCenterId",
    "assignedTo",
  ]) {
    const val = entity[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (val && typeof val === "object") {
      const id = val._id ?? val.id;
      if (id != null && String(id).trim() !== "") return String(id);
    }
  }
  const a = entity.assignment;
  if (a && typeof a === "object") {
    for (const key of ["assignedTo", "cadUserId", "assignedCadUserId", "cadUser", "assignedCadUser", "cadCenter"]) {
      const val = a[key];
      if (typeof val === "string" && val.trim()) return val.trim();
      if (val && typeof val === "object") {
        const id = val._id ?? val.id;
        if (id != null && String(id).trim() !== "") return String(id);
      }
    }
  }
  if (entity.assignedCadUser && typeof entity.assignedCadUser === "object") {
    const id = entity.assignedCadUser._id ?? entity.assignedCadUser.id;
    if (id != null && String(id).trim() !== "") return String(id);
  }
  if (typeof entity.assignedCadUser === "string" && entity.assignedCadUser.trim()) {
    return entity.assignedCadUser.trim();
  }
  return null;
}

/**
 * Resolve assignment id for pullback when list/detail omit it.
 * Uses cache, sketch detail, then POST conflict (409) probe only.
 */
export async function lookupAssignmentIdForSketch(uploadId, assignedCadUserId) {
  if (uploadId == null || String(uploadId).trim() === "") return null;

  const uploadKey = String(uploadId);
  const row = {
    _id: uploadKey,
    assignedCadUserId: assignedCadUserId ?? undefined,
    assignedCadCenterId: assignedCadUserId ?? undefined,
  };

  let assignmentId = resolveAssignmentIdFromEntity(row);
  if (assignmentId && assignmentId !== uploadKey) return assignmentId;

  const cached = getCachedAssignmentIdForSketch(uploadKey);
  if (cached) return cached;

  const enriched = await enrichSketchUploadRow(row);
  assignmentId = resolveAssignmentIdFromEntity(enriched);
  if (assignmentId && assignmentId !== uploadKey) return assignmentId;

  const cadId = assignedCadUserId ?? resolveAssignedCadUserIdFromEntity(enriched);
  if (cadId) {
    assignmentId = await probeAssignmentIdFromPost(uploadKey, cadId);
    if (assignmentId) return assignmentId;
  }

  return getCachedAssignmentIdForSketch(uploadKey);
}

/**
 * Load sketch upload + linked assignment for View Details drawer.
 * Uses sketch detail, cache, then GET /api/admin/survey-sketch-assignments/{assignmentId}.
 */
export async function loadSketchUploadWithAssignment(uploadId, seedRecord = {}) {
  const uploadKey = String(uploadId);
  const sketchRes = await getSketchUploadById(uploadKey);
  const sketch = sketchRes?.data;
  if (!sketch) {
    throw new Error("Failed to load sketch upload");
  }

  let assignmentId =
    resolveAssignmentIdFromEntity(seedRecord) ??
    resolveAssignmentIdFromEntity(sketch) ??
    getCachedAssignmentIdForSketch(uploadKey);

  if (!assignmentId || assignmentId === uploadKey) {
    const embedded = findEmbeddedAssignmentInDetail(sketch, uploadKey);
    assignmentId = embedded?._id ?? embedded?.id ?? null;
  }

  const sketchStatus = String(sketch?.status || seedRecord?.status || "").toUpperCase();
  const SKETCH_STATUSES_IMPLYING_ASSIGNMENT = new Set([
    "ASSIGNED",
    "CAD_DELIVERED",
    "UNDER_REVIEW",
    "UNDER_REVISION",
    "APPROVED",
    "REJECTED",
  ]);
  const isLikelyAssigned =
    SKETCH_STATUSES_IMPLYING_ASSIGNMENT.has(sketchStatus) ||
    sketch?.assignedAt != null ||
    seedRecord?.assignedAt != null;

  if ((!assignmentId || assignmentId === uploadKey) && isLikelyAssigned) {
    const cadHint = resolveAssignedCadUserIdFromEntity({ ...sketch, ...seedRecord });
    assignmentId = await lookupAssignmentIdForSketch(uploadKey, cadHint);
  }

  let assignment = null;
  if (assignmentId && String(assignmentId) !== uploadKey) {
    try {
      assignment = await getAssignmentById(assignmentId);
      cacheAssignmentIdForSketch(uploadKey, assignmentId);
    } catch {
      assignment = { _id: assignmentId };
    }
  }

  const merged = {
    ...seedRecord,
    ...sketch,
    assignmentId:
      assignmentId && String(assignmentId) !== uploadKey ? String(assignmentId) : undefined,
    assignment: assignment ?? sketch.assignment ?? seedRecord.assignment,
  };

  const assignedCadUserId = resolveAssignedCadUserIdFromEntity({
    ...merged,
    assignment: merged.assignment,
  });
  if (assignedCadUserId) {
    merged.assignedCadUserId = assignedCadUserId;
    merged.assignedCadCenterId = merged.assignedCadCenterId ?? assignedCadUserId;
  }

  return merged;
}

/** @deprecated Use loadSketchUploadWithAssignment + pullbackReassignAssignment */
export async function reassignCadUserForSketchUpload(uploadId, assignedCadUserId, options = {}) {
  const uploadKey = String(uploadId);
  const assignmentId =
    options.assignmentId ??
    (options.entity ? resolveAssignmentIdFromEntity(options.entity) : null) ??
    (await lookupAssignmentIdForSketch(uploadKey, options.currentCadUserId ?? assignedCadUserId));

  if (!assignmentId) {
    throw new Error("Missing assignment id for this sketch.");
  }

  return pullbackReassignAssignment(assignmentId, { assignedCadUserId });
}

/** CAD assignment list/detail row id */
function resolveCadAssignmentRecord(entity) {
  if (!entity || typeof entity !== "object") return null;
  if (entity.assignment && typeof entity.assignment === "object") return entity.assignment;
  return entity;
}

export function resolveCadAssignmentId(assignment) {
  const record = resolveCadAssignmentRecord(assignment);
  const nested = resolveAssignmentIdFromEntity(assignment);
  if (nested) return nested;
  if (!record) return null;
  const id = record._id ?? record.id;
  if (id != null && String(id).trim() !== "") return String(id);
  return null;
}

const CAD_ACCEPTED_ASSIGNMENT_STATUSES = new Set([
  "IN_PROGRESS",
  "COMPLETED",
  "ON_HOLD",
  "NEED_CHANGES",
]);

export function resolveCadAssignmentStatus(assignment) {
  const record = resolveCadAssignmentRecord(assignment);
  if (!record) return "ASSIGNED";
  const raw =
    record.status ??
    record.assignmentStatus ??
    record.cadAssignmentStatus;
  return raw != null ? String(raw).toUpperCase() : "ASSIGNED";
}

/** True after CAD user accepts (status leaves ASSIGNED/PENDING/CANCELLED). */
export function isCadAssignmentAccepted(assignment) {
  const record = resolveCadAssignmentRecord(assignment);
  if (!record) return false;
  if (record.acceptedAt || record.cadAcceptedAt || record.acceptedByCadAt) {
    return true;
  }
  return CAD_ACCEPTED_ASSIGNMENT_STATUSES.has(resolveCadAssignmentStatus(assignment));
}

export function formatUserDisplayLabel(input) {
  if (input == null || input === "") return "";
  if (typeof input === "string") return input.trim();
  if (typeof input !== "object") return String(input);

  const u = input;
  if (typeof u.fullName === "string" && u.fullName.trim()) return u.fullName.trim();

  const n = u.name;
  if (typeof n === "string" && n.trim()) return n.trim();
  if (n && typeof n === "object") {
    const parts = [n.first, n.last].filter(
      (p) => p != null && String(p).trim() !== ""
    );
    if (parts.length) return parts.map(String).join(" ").trim();
  }

  const email = u.auth?.email ?? u.email;
  if (email) return String(email);
  const phone = u.auth?.phone ?? u.mobile ?? u.phone;
  if (phone) return String(phone);

  const id = u._id ?? u.id;
  return id ? String(id) : "";
}

export async function getSurveySketchStatuses() {
  try {
    const { data } = await apiClient.get("/api/admin/survey-sketch-statuses");
    return normalizeSurveySketchStatusesPayload(unwrapData(data) ?? data);
  } catch (error) {
    handleError(error, "Failed to fetch survey sketch statuses");
  }
}

/**
 * Admin assignments table — same list as superadmin projects (sketch uploads).
 * GET /api/surveyor/sketch-uploads?page=&limit=&status=
 */
export async function getSurveySketchUploads(status, page, limit) {
  try {
    const params = {};
    if (status) params.status = status;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const { data } = await apiClient.get("/api/surveyor/sketch-uploads", { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch survey sketch uploads");
  }
}

export async function getAssignmentFlow() {
  try {
    const { data } = await apiClient.get("/api/admin/survey-sketch-assignment-flow");
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to fetch assignment flow");
  }
}

export async function updateAssignmentFlow(payload) {
  try {
    const { data } = await apiClient.patch("/api/admin/survey-sketch-assignment-flow", payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to update assignment flow");
  }
}

/**
 * CAD users via GET /api/users?role=CAD&page=&limit=&status=
 * Fetches all pages using meta.totalPages.
 */
export async function getCadUsers(options = {}) {
  try {
    const pageLimit = Math.min(Math.max(Number(options.limit) || 100, 1), 200);
    const status = options.status;
    let page = 1;
    const all = [];

    for (;;) {
      const params = { role: "CAD", page, limit: pageLimit };
      if (status) params.status = status;
      const { data } = await apiClient.get("/api/users", { params });
      const inner = unwrapData(data);
      const batch = Array.isArray(inner)
        ? inner
        : Array.isArray(inner?.items)
          ? inner.items
          : [];
      all.push(...batch);
      const meta =
        inner && typeof inner === "object" && !Array.isArray(inner)
          ? inner.meta
          : undefined;
      const totalPages = Math.max(Number(meta?.totalPages ?? 1), 1) || 1;
      if (page >= totalPages || batch.length === 0) break;
      page += 1;
    }

    return filterCadRoleUsers(all);
  } catch (error) {
    handleError(error, "Failed to fetch CAD users");
  }
}

export async function createAssignment(payload) {
  const body = buildCreateAssignmentPayload(payload);
  const uploadId = body.surveyorSketchUploadId;
  if (!uploadId) {
    throw new Error("surveyorSketchUploadId is required");
  }
  if (!body.assignedCadUserId) {
    throw new Error("assignedCadUserId is required");
  }

  try {
    const { data } = await apiClient.post("/api/admin/survey-sketch-assignments", body);
    const assignment = unwrapData(data);
    const assignmentId = assignment?._id ?? assignment?.id;
    if (assignmentId) {
      cacheAssignmentIdForSketch(uploadId, assignmentId);
    }
    return assignment;
  } catch (error) {
    if (error.response?.status === 409) {
      const existing =
        findAssignmentInConflictBody(error.response?.data, uploadId) ??
        parseAssignmentFromApiBody(error.response?.data);
      const assignmentId = existing?._id ?? existing?.id;
      if (assignmentId) {
        cacheAssignmentIdForSketch(uploadId, assignmentId);
        return existing;
      }
    }
    handleError(error, "Failed to create assignment");
  }
}

export async function updateAssignment(id, payload) {
  try {
    const patchBody = { ...payload };
    delete patchBody.surveyorSketchUploadId;
    delete patchBody.sketchUploadId;
    // M-10: client dueDate is ignored for SLA authority — do not send.
    delete patchBody.dueDate;
    delete patchBody.dueAt;
    if (patchBody.assignedToUserId && !patchBody.assignedCadUserId) {
      patchBody.assignedCadUserId = patchBody.assignedToUserId;
      delete patchBody.assignedToUserId;
    }
    const { data } = await apiClient.patch(`/api/admin/survey-sketch-assignments/${id}`, patchBody);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to update assignment");
  }
}

/**
 * Extend assignment SLA (M-10).
 * POST /api/admin/survey-sketch-assignments/{assignmentId}/sla-extend
 * @param {string} assignmentId
 * @param {{ hours?: number, ms?: number, reason: string }} body
 */
export async function extendAssignmentSla(assignmentId, body = {}) {
  try {
    if (!assignmentId) throw new Error("assignmentId is required");
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) throw new Error("reason is required");

    const payload = { reason };
    if (body.ms != null && body.ms !== "") {
      const ms = Number(body.ms);
      if (!Number.isFinite(ms) || ms <= 0) throw new Error("ms must be a positive number");
      payload.ms = ms;
    } else {
      const hours = Number(body.hours);
      if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error("hours must be a positive number");
      }
      payload.hours = hours;
    }

    const { data } = await apiClient.post(
      `/api/admin/survey-sketch-assignments/${assignmentId}/sla-extend`,
      payload
    );
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to extend assignment SLA");
  }
}

/** Reassign while assignment is ASSIGNED (PATCH). */
export async function reassignAssignmentCadUser(assignmentId, assignedCadUserId) {
  return updateAssignment(assignmentId, { assignedCadUserId });
}

/**
 * Pull back assignment from current CAD and assign to another CAD user.
 * POST /api/admin/survey-sketch-assignments/{assignmentId}/pullback-reassign
 * Allowed assignment statuses (typical): ASSIGNED, IN_PROGRESS, ON_HOLD.
 * @param {string} assignmentId
 * @param {{ assignedCadUserId: string, reason?: string }} body
 */
export async function pullbackReassignAssignment(assignmentId, body) {
  try {
    const assignedCadUserId = body?.assignedCadUserId;
    if (!assignedCadUserId) {
      throw new Error("assignedCadUserId is required");
    }
    const payload = { assignedCadUserId };
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (reason) payload.reason = reason;
    const { data } = await apiClient.post(
      `/api/admin/survey-sketch-assignments/${assignmentId}/pullback-reassign`,
      payload
    );
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to pull back and reassign assignment");
  }
}

export async function getAssignmentById(id) {
  try {
    const { data } = await apiClient.get(`/api/admin/survey-sketch-assignments/${id}`);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to fetch assignment");
  }
}

export async function getCadAssignments(params = {}) {
  try {
    const { data } = await apiClient.get("/api/cad/assignments", { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch CAD assignments");
  }
}

export async function getCadSketchUpload(uploadId) {
  try {
    const { data } = await apiClient.get(`/api/cad/sketch-uploads/${uploadId}`);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to fetch sketch upload");
  }
}

export async function respondCadAssignment(assignmentId, action) {
  try {
    const { data } = await apiClient.post(`/api/cad/assignments/${assignmentId}/accept`, {
      action,
    });
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to update assignment status");
  }
}

export async function rejectCadAssignment(assignmentId) {
  try {
    const { data } = await apiClient.post(`/api/cad/assignments/${assignmentId}/reject`);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to reject assignment");
  }
}

export async function deliverCadAssignment(assignmentId, payload) {
  try {
    const { data } = await apiClient.post(`/api/cad/assignments/${assignmentId}/deliver`, payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to deliver CAD assignment");
  }
}

/**
 * GET /api/surveyor/assignments/{assignmentId}/feedback
 * Allowed: surveyor owner, assigned CAD, Admin, Super Admin.
 * @returns {Promise<object|null>} Feedback document or null if none (404).
 */
export async function getAssignmentFeedback(assignmentId) {
  try {
    const { data } = await apiClient.get(`/api/surveyor/assignments/${assignmentId}/feedback`);
    return unwrapData(data);
  } catch (error) {
    if (error.response?.status === 404) return null;
    handleError(error, "Failed to load assignment feedback");
  }
}

/**
 * POST /api/surveyor/assignments/{assignmentId}/feedback
 * Surveyor submits or updates feedback for the assignment CAD user.
 * @param {string} assignmentId
 * @param {{ rating: number, remarks?: string, audio?: { url: string, fileName?: string, mimeType?: string, size?: number } }} payload
 */
export async function submitAssignmentFeedback(assignmentId, payload) {
  try {
    const { data } = await apiClient.post(`/api/surveyor/assignments/${assignmentId}/feedback`, payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to save assignment feedback");
  }
}

