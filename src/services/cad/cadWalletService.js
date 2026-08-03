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
    receivedPaymentRupees:
      Number(
        r.receivedPaymentRupees ??
          r.receivedPayments ??
          r.receivedPayment ??
          r.received ??
          0
      ) || 0,
    pendingPaymentRupees:
      Number(
        r.pendingPaymentRupees ?? r.pendingPayments ?? r.pendingPayment ?? r.pending ?? 0
      ) || 0,
  };
}

/**
 * @param {any} raw
 */
export function mapOrderStats(raw) {
  const r = raw?.orders ?? raw?.data?.orders ?? raw ?? {};
  const countSemantics =
    r.countSemantics && typeof r.countSemantics === "object"
      ? r.countSemantics
      : typeof r.countSemantics === "string"
        ? { note: r.countSemantics }
        : null;
  return {
    totalOrders: Number(r.totalOrders ?? 0) || 0,
    acceptedOrders: Number(r.acceptedOrders ?? 0) || 0,
    rejectedOrders: Number(r.rejectedOrders ?? 0) || 0,
    inProgressOrders: Number(r.inProgressOrders ?? 0) || 0,
    /** CAD-03 — ASSIGNED / awaiting accept (additive). */
    pendingAcceptOrders: Number(r.pendingAcceptOrders ?? 0) || 0,
    /** CAD-03 — completed assignments (additive). */
    completedOrders: Number(r.completedOrders ?? 0) || 0,
    countSemantics,
  };
}

/**
 * @param {any} raw — API envelope `{ success, data: { wallet, orders } }` or inner `data`
 */
export function mapDashboardOverview(raw) {
  const envelope = raw?.data?.wallet != null || raw?.data?.orders != null ? raw.data : raw;
  return {
    wallet: mapWalletSummary(envelope?.wallet ?? {}),
    orders: mapOrderStats(envelope?.orders ?? {}),
  };
}

export async function getCadDashboardOverview() {
  try {
    const { data } = await apiClient.get("/api/cad/dashboard/overview");
    return mapDashboardOverview(data);
  } catch (e) {
    handleError(e, "Failed to load dashboard");
  }
}

/**
 * @param {any} raw
 * @returns {{ list: any[], total: number, page: number, limit: number }}
 */
export function mapWalletTransactionsResponse(raw) {
  const envelope = raw?.data != null && Array.isArray(raw.data) ? raw : null;
  const root = envelope ? envelope.data : raw?.data ?? raw;
  const list =
    Array.isArray(root) ? root :
    Array.isArray(root?.transactions) ? root.transactions :
    Array.isArray(root?.items) ? root.items :
    Array.isArray(root?.data) ? root.data :
    Array.isArray(root?.results) ? root.results :
    [];
  const meta = envelope?.meta ?? root?.meta ?? raw?.meta ?? root?.pagination ?? raw?.pagination ?? root;
  const pagination = meta?.pagination ?? meta;
  const page = Number(pagination?.page ?? meta?.page ?? meta?.currentPage ?? 1) || 1;
  const limit = Number(pagination?.limit ?? meta?.limit ?? meta?.perPage ?? 20) || 20;
  const total =
    Number(pagination?.total ?? meta?.total ?? meta?.totalItems ?? meta?.count ?? list.length) ||
    list.length;
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
