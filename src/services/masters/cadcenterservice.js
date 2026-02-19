import apiClient from "../apiClient.js";

const BASE = "/api/masters/cad-centers";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/cad-centers - Create CAD Center */
export async function createCadCenter(payload) {
  try {
    const { data } = await apiClient.post(BASE, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to create CAD center");
  }
}

/** GET /api/masters/cad-centers - List CAD Centers */
export async function getCadCenters() {
  try {
    const { data } = await apiClient.get(BASE);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch CAD centers");
  }
}

/** GET /api/masters/cad-centers/{cadCenterId} - Get CAD Center by ID */
export async function getCadCenterById(cadCenterId) {
  try {
    const { data } = await apiClient.get(`${BASE}/${cadCenterId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch CAD center");
  }
}

/** PATCH /api/masters/cad-centers/{cadCenterId} - Update CAD Center */
export async function updateCadCenter(cadCenterId, payload) {
  try {
    const { data } = await apiClient.patch(`${BASE}/${cadCenterId}`, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to update CAD center");
  }
}

/** DELETE /api/masters/cad-centers/{cadCenterId} - Delete CAD Center (Soft Delete) */
export async function deleteCadCenter(cadCenterId) {
  try {
    const { data } = await apiClient.delete(`${BASE}/${cadCenterId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to delete CAD center");
  }
}
