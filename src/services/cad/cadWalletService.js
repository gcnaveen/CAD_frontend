import apiClient from "../apiClient.js";

function handleError(error, fallbackMessage) {
  const msg = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(msg);
}

/**
 * @param {any} raw
 */
export function mapWalletSummary(raw) {
  const r = raw?.data ?? raw ?? {};
  return {
    totalEarningsRupees: Number(r.totalEarningsRupees ?? r.totalEarnings ?? 0) || 0,
    receivedPaymentRupees: Number(r.receivedPaymentRupees ?? r.received ?? 0) || 0,
    pendingPaymentRupees: Number(r.pendingPaymentRupees ?? r.pending ?? 0) || 0,
  };
}

/**
 * @param {any} raw
 * @returns {{ list: any[], total: number, page: number, limit: number }}
 */
export function mapWalletTransactionsResponse(raw) {
  const root = raw?.data ?? raw;
  const list =
    Array.isArray(root) ? root :
    Array.isArray(root?.transactions) ? root.transactions :
    Array.isArray(root?.items) ? root.items :
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root?.results) ? root.results :
    [];
  const meta = root?.meta ?? root?.pagination ?? root;
  const page = Number(meta?.page ?? meta?.currentPage ?? 1) || 1;
  const limit = Number(meta?.limit ?? meta?.perPage ?? 20) || 20;
  const total = Number(meta?.total ?? meta?.totalItems ?? meta?.count ?? list.length) || list.length;
  return { list, total, page, limit };
}

export async function getCadWallet() {
  try {
    const { data } = await apiClient.get("/api/cad/wallet");
    return mapWalletSummary(data);
  } catch (e) {
    handleError(e, "Failed to load wallet");
  }
}

/**
 * @param {{ page?: number, limit?: number }} params
 */
export async function getCadWalletTransactions(params = {}) {
  try {
    const { data } = await apiClient.get("/api/cad/wallet/transactions", {
      params: { page: params.page ?? 1, limit: params.limit ?? 20 },
    });
    return mapWalletTransactionsResponse(data);
  } catch (e) {
    handleError(e, "Failed to load transactions");
  }
}
