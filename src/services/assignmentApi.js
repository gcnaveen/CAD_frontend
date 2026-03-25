import apiClient from "./apiClient.js";

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
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to fetch survey sketch statuses");
  }
}

export async function getSurveySketchUploads(status, page, limit) {
  try {
    const params = {};
    if (status) params.status = status;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    const { data } = await apiClient.get("/api/admin/survey-sketch-uploads", { params });
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
  try {
    const { data } = await apiClient.post("/api/admin/survey-sketch-assignments", payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to create assignment");
  }
}

export async function updateAssignment(id, payload) {
  try {
    const { data } = await apiClient.patch(`/api/admin/survey-sketch-assignments/${id}`, payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to update assignment");
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

export async function deliverCadAssignment(assignmentId, payload) {
  try {
    const { data } = await apiClient.post(`/api/cad/assignments/${assignmentId}/deliver`, payload);
    return unwrapData(data);
  } catch (error) {
    handleError(error, "Failed to deliver CAD assignment");
  }
}

