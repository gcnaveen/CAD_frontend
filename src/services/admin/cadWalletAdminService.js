import apiClient from "../apiClient.js";

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
