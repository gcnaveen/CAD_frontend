import apiClient from "../apiClient.js";
import {
  handleMasterWriteError,
  masterWriteAuthConfig,
} from "./masterAuth.js";

const BASE = "/api/masters/districts";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/** POST /api/masters/districts - Create District (Bearer + SUPER_ADMIN) */
export async function createDistrict(payload) {
  try {
    const { data } = await apiClient.post(BASE, payload, masterWriteAuthConfig());
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to create district");
  }
}

/** Extract district rows from common API response shapes. */
export function normalizeDistrictList(res) {
  const raw = res?.data ?? res;
  const items = raw?.items ?? (Array.isArray(raw) ? raw : []);
  return Array.isArray(items) ? items : [];
}

/** Keep only districts with status ACTIVE (case-insensitive). */
export function filterActiveDistricts(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((d) => String(d?.status ?? "ACTIVE").toUpperCase() === "ACTIVE");
}

function applyActiveDistrictFilter(res) {
  const raw = res?.data ?? res;
  if (Array.isArray(raw)) {
    return filterActiveDistricts(raw);
  }
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    const filtered = filterActiveDistricts(raw.items);
    if (res?.data != null) {
      return { ...res, data: { ...raw, items: filtered } };
    }
    return { ...raw, items: filtered };
  }
  return filterActiveDistricts(normalizeDistrictList(res));
}

/** GET /api/masters/districts - List Districts (optional page, limit, etc.) */
export async function getDistricts(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch districts");
  }
}

/** GET /api/masters/districts?status=ACTIVE — for dropdowns and selection UIs. */
export async function getActiveDistricts(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params: { ...params, status: "ACTIVE" } });
    return applyActiveDistrictFilter(data);
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

/** PATCH /api/masters/districts/{districtId} - Update District (Bearer + SUPER_ADMIN) */
export async function updateDistrict(districtId, payload) {
  try {
    const { data } = await apiClient.patch(
      `${BASE}/${districtId}`,
      payload,
      masterWriteAuthConfig()
    );
    return data;
  } catch (error) {
    handleMasterWriteError(error, "Failed to update district");
  }
}
