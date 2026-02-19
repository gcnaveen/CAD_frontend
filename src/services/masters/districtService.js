import apiClient from "../apiClient.js";

const BASE = "/api/masters/districts";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/districts - Create District */
export async function createDistrict(payload) {
  try {
    const { data } = await apiClient.post(BASE, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to create district");
  }
}

/** GET /api/masters/districts - List Districts */
export async function getDistricts() {
  try {
    const { data } = await apiClient.get(BASE);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch districts");
  }
}

/** GET /api/masters/districts/{districtId} - Get District by ID */
export async function getDistrictById(districtId) {
  try {
    const { data } = await apiClient.get(`${BASE}/${districtId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch district");
  }
}

/** PATCH /api/masters/districts/{districtId} - Update District */
export async function updateDistrict(districtId, payload) {
  try {
    const { data } = await apiClient.patch(`${BASE}/${districtId}`, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to update district");
  }
}
