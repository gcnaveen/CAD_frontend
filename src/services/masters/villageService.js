import apiClient from "../apiClient.js";
import {
  handleMasterWriteError,
  masterWriteAuthConfig,
} from "./masterAuth.js";

const BASE = "/api/masters/villages";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/villages - Create Village (Bearer + SUPER_ADMIN) */
export async function createVillage(payload) {
  try {
    const { data } = await apiClient.post(BASE, payload, masterWriteAuthConfig());
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to create village");
  }
}

/** GET /api/masters/villages - List Villages (supports districtId, talukaId, hobliId, hobli, status, page, limit) */
export async function getVillages(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch villages");
  }
}

/** GET /api/masters/villages/{villageId} - Get Village by ID */
export async function getVillageById(villageId) {
  try {
    const { data } = await apiClient.get(`${BASE}/${villageId}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch village");
  }
}

/** PATCH /api/masters/villages/{villageId} - Update Village (Bearer + SUPER_ADMIN) */
export async function updateVillage(villageId, payload) {
  try {
    const { data } = await apiClient.patch(
      `${BASE}/${villageId}`,
      payload,
      masterWriteAuthConfig()
    );
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to update village");
  }
}
