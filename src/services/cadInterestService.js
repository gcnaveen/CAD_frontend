import apiClient from "./apiClient.js";

/**
 * List CAD interest submissions (Admin/Super Admin)
 * GET /api/cad-interest?page=1&limit=20
 */
export async function getCadInterests(params = {}) {
  try {
    const { data } = await apiClient.get("/api/cad-interest", { params });
    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ??
      error.message ??
      "Failed to fetch CAD interests";
    throw new Error(message);
  }
}
