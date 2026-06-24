import apiClient from "../apiClient.js";
import { mapWalletSummary } from "../cad/cadWalletService.js";

function handleError(error, fallbackMessage) {
  const msg = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(msg);
}

/**
 * POST /api/admin/cad-wallet-entries/{entryId}/mark-paid
 */
export async function markCadWalletEntryPaid(entryId) {
  try {
    const { data } = await apiClient.post(`/api/admin/cad-wallet-entries/${entryId}/mark-paid`);
    return data;
  } catch (e) {
    handleError(e, "Failed to mark as paid");
  }
}

/**
 * POST /api/admin/cad-wallet-entries/{entryId}/record-payment
 * @param {{ amountRupees?: number, payFull?: boolean }} body — mutually exclusive
 */
export async function recordCadWalletEntryPayment(entryId, body) {
  try {
    const { data } = await apiClient.post(
      `/api/admin/cad-wallet-entries/${entryId}/record-payment`,
      body
    );
    return data;
  } catch (e) {
    handleError(e, "Failed to record payment");
  }
}

/**
 * @param {any} raw
 */
export function mapPayCadUserResponse(raw) {
  const r = raw?.data ?? raw ?? {};
  return {
    summary: mapWalletSummary(r.summary ?? r),
    appliedAmountRupees: Number(r.appliedAmountRupees ?? 0) || 0,
    unappliedAmountRupees: Number(r.unappliedAmountRupees ?? 0) || 0,
    touchedEntryIds: Array.isArray(r.touchedEntryIds) ? r.touchedEntryIds : [],
  };
}

/**
 * POST /api/admin/cad-wallet/pay-user
 * @param {{ cadUserId: string, amountPaise: number }} body
 */
export async function payCadUser(body) {
  try {
    const { data } = await apiClient.post("/api/admin/cad-wallet/pay-user", body);
    return mapPayCadUserResponse(data);
  } catch (e) {
    handleError(e, "Failed to pay CAD user");
  }
}
