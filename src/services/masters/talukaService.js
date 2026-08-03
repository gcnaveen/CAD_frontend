import apiClient from "../apiClient.js";
import {
  handleMasterWriteError,
  masterWriteAuthConfig,
} from "./masterAuth.js";

const BASE = "/api/masters";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/talukas - Create Taluka (Bearer + SUPER_ADMIN) */
export async function createTaluka(payload) {
  try {
    const { data } = await apiClient.post(
      `${BASE}/talukas`,
      payload,
      masterWriteAuthConfig()
    );
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to create taluka");
  }
}

/** GET /api/masters/districts/{districtId}/talukas - List Talukas by District */
export async function getTalukasByDistrict(districtId, params = {}) {
  try {
    const { data } = await apiClient.get(`${BASE}/districts/${districtId}/talukas`, {
      params,
    });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch talukas");
  }
}

/** GET /api/masters/talukas/{talukaId} - Get Taluka by ID */
export async function getTalukaById(talukaId) {
  try {
    const { data } = await apiClient.get(`${BASE}/talukas/${talukaId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch taluka");
  }
}

/** PATCH /api/masters/talukas/{talukaId} - Update Taluka (Bearer + SUPER_ADMIN) */
export async function updateTaluka(talukaId, payload) {
  try {
    const { data } = await apiClient.patch(
      `${BASE}/talukas/${talukaId}`,
      payload,
      masterWriteAuthConfig()
    );
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to update taluka");
  }
}
