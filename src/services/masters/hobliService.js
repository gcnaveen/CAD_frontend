import apiClient from "../apiClient.js";

const BASE = "/api/masters";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/hoblis - Create Hobli */
export async function createHobli(payload) {
  try {
    const { data } = await apiClient.post(`${BASE}/hoblis`, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to create hobli");
  }
}

/** GET /api/masters/talukas/{talukaId}/hoblis - List Hoblis by Taluka */
export async function getHoblisByTaluka(talukaId, params = {}) {
  try {
    const { data } = await apiClient.get(`${BASE}/talukas/${talukaId}/hoblis`, {
      params,
    });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch hoblis");
  }
}

/** GET /api/masters/hoblis/{hobliId} - Get Hobli by ID */
export async function getHobliById(hobliId) {
  try {
    const { data } = await apiClient.get(`${BASE}/hoblis/${hobliId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch hobli");
  }
}

/** PATCH /api/masters/hoblis/{hobliId} - Update Hobli */
export async function updateHobli(hobliId, payload) {
  try {
    const { data } = await apiClient.patch(`${BASE}/hoblis/${hobliId}`, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to update hobli");
  }
}
