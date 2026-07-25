import apiClient from "../apiClient.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";
import {
  MANUAL_GATE_REASONS,
  normalizeAssignmentFlow,
  normalizeAutoAssignAttempts,
  normalizeAutoAssignExceptions,
  normalizeManualAssignGate,
  parseManualAssignBlocked,
  resolveManualAssignUi,
  formatOverrideAt,
  formatAutoAssignActiveHint,
  formatManualAssignBlockedMessage,
} from "../../utils/autoAssignManualGate.js";

export {
  MANUAL_GATE_REASONS,
  normalizeAssignmentFlow,
  normalizeAutoAssignAttempts,
  normalizeAutoAssignExceptions,
  normalizeManualAssignGate,
  parseManualAssignBlocked,
  resolveManualAssignUi,
  formatOverrideAt,
  formatAutoAssignActiveHint,
  formatManualAssignBlockedMessage,
};

function handleError(error, fallbackMessage) {
  const message = getApiErrorMessage(error, fallbackMessage);
  const err = new Error(message);
  err.status = error?.response?.status;
  err.data = error?.response?.data;
  if (error?.correlationId) err.correlationId = error.correlationId;
  throw err;
}

function unwrapData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

/**
 * GET /api/admin/sketch-uploads/{uploadId}/auto-assign/manual-gate
 * @param {string} uploadId
 */
export async function getManualAssignGate(uploadId) {
  if (!uploadId) throw new Error("uploadId is required");
  try {
    const { data } = await apiClient.get(
      `/api/admin/sketch-uploads/${uploadId}/auto-assign/manual-gate`
    );
    return normalizeManualAssignGate(data);
  } catch (error) {
    handleError(error, "Failed to load manual assign gate");
  }
}

/**
 * GET /api/admin/auto-assign/exceptions
 * @param {{ page?: number, limit?: number, status?: string }} [params]
 */
export async function getAutoAssignExceptions(params = {}) {
  try {
    const query = {};
    if (params.page != null) query.page = params.page;
    if (params.limit != null) query.limit = params.limit;
    if (params.status) query.status = params.status;
    const { data } = await apiClient.get("/api/admin/auto-assign/exceptions", {
      params: query,
    });
    return normalizeAutoAssignExceptions(data);
  } catch (error) {
    handleError(error, "Failed to load auto-assign exceptions");
  }
}

/**
 * POST /api/admin/sketch-uploads/{uploadId}/auto-assign/retry
 * @param {string} uploadId
 */
export async function retryAutoAssign(uploadId) {
  if (!uploadId) throw new Error("uploadId is required");
  try {
    const { data } = await apiClient.post(
      `/api/admin/sketch-uploads/${uploadId}/auto-assign/retry`
    );
    return unwrapData(data) ?? data;
  } catch (error) {
    handleError(error, "Failed to retry auto-assign");
  }
}

/**
 * GET /api/admin/sketch-uploads/{uploadId}/auto-assign/attempts
 * @param {string} uploadId
 */
export async function getAutoAssignAttempts(uploadId) {
  if (!uploadId) throw new Error("uploadId is required");
  try {
    const { data } = await apiClient.get(
      `/api/admin/sketch-uploads/${uploadId}/auto-assign/attempts`
    );
    return normalizeAutoAssignAttempts(data);
  } catch (error) {
    handleError(error, "Failed to load auto-assign attempts");
  }
}

/**
 * Fetch gates for many PENDING upload ids (best-effort per id).
 * @param {string[]} uploadIds
 * @returns {Promise<Record<string, ReturnType<typeof normalizeManualAssignGate>>>}
 */
export async function loadManualAssignGates(uploadIds) {
  const ids = [...new Set((uploadIds || []).map((id) => String(id)).filter(Boolean))];
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const gate = await getManualAssignGate(id);
        return [id, gate];
      } catch (err) {
        return [
          id,
          normalizeManualAssignGate({
            allowed: true,
            reason: "GATE_UNAVAILABLE",
            message: err?.message || "Gate unavailable",
          }),
        ];
      }
    })
  );
  return Object.fromEntries(entries);
}
