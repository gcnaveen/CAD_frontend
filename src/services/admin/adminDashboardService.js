import apiClient from "../apiClient.js";

function handleError(error, fallbackMessage) {
  const msg = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(msg);
}

/** GET /api/admin/dashboard/stats */
export async function fetchAdminDashboardStats() {
  try {
    const { data } = await apiClient.get("/api/admin/dashboard/stats");
    return data?.data ?? data;
  } catch (e) {
    handleError(e, "Failed to load dashboard statistics");
  }
}
