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

export async function getCadUsers() {
  try {
    const { data } = await apiClient.get("/api/users");
    const list = unwrapData(data);
    const users = Array.isArray(list)
      ? list
      : Array.isArray(list?.users)
        ? list.users
        : Array.isArray(list?.results)
          ? list.results
          : [];
    return users.filter((u) => u?.role === "CAD");
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

