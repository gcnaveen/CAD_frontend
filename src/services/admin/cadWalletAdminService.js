import apiClient from "../apiClient.js";
import { mapWalletSummary } from "../cad/cadWalletService.js";
import {
  mapLedgerSettlement,
  resolveLedgerPayoutRupees,
} from "../../utils/cadOperatorEarnings.js";
import { getApiErrorMessage } from "../../utils/apiErrorMessage.js";

function handleError(error, fallbackMessage) {
  throw new Error(getApiErrorMessage(error, fallbackMessage));
}

function numRupees(raw, rupeesKey, paiseKey, altKey) {
  const r = raw ?? {};
  if (r[rupeesKey] != null) return Number(r[rupeesKey]) || 0;
  if (r[altKey] != null) return Number(r[altKey]) || 0;
  if (r[paiseKey] != null) return (Number(r[paiseKey]) || 0) / 100;
  return 0;
}

/**
 * @param {any} raw
 */
export function mapCadPayoutStatistics(raw) {
  const s = raw ?? {};
  const settlement = mapLedgerSettlement(s);
  return {
    /** @deprecated Prefer payoutModel + payoutRupees from business-rules / settlement. */
    payoutPercent: Number(s.payoutPercent ?? 0) || 0,
    payoutModel: settlement.payoutModel,
    payoutRupees: settlement.payoutRupees,
    pricingRuleVersion: settlement.pricingRuleVersion,
    cadUserCount: Number(s.cadUserCount ?? 0) || 0,
    assignmentCount: Number(s.assignmentCount ?? 0) || 0,
    completedDeliveryCount: Number(s.completedDeliveryCount ?? 0) || 0,
    totalSourcePaidRupees: numRupees(
      s,
      "totalSourcePaidRupees",
      "totalSourcePaidPaise",
      "totalSourcePaid"
    ),
    totalEarningsRupees: numRupees(
      s,
      "totalEarningsRupees",
      "totalEarningsPaise",
      "totalEarnings"
    ),
    receivedPaymentRupees: numRupees(
      s,
      "receivedPaymentRupees",
      "receivedPaymentPaise",
      "receivedPayment"
    ),
    pendingPaymentRupees: numRupees(
      s,
      "pendingPaymentRupees",
      "pendingPaymentPaise",
      "pendingPayment"
    ),
  };
}

/**
 * @param {any} raw
 */
export function mapCadPayoutEntry(raw) {
  const e = raw ?? {};
  const settlement = mapLedgerSettlement(e);
  const legacyAmount = numRupees(e, "amountRupees", "amountPaise", "amount");
  return {
    ledgerId: e.ledgerId ?? e._id ?? e.id ?? "",
    kind: e.kind ?? "—",
    revisionNo: e.revisionNo ?? 0,
    sourcePaidRupees: numRupees(e, "sourcePaidRupees", "sourcePaidAmountPaise", "sourcePaid"),
    /** @deprecated Prefer settlement.payoutModel / payoutPaise. */
    payoutPercent: settlement.payoutPercent ?? (Number(e.payoutPercent ?? 0) || 0),
    amountRupees: resolveLedgerPayoutRupees(e, legacyAmount),
    paidAmountRupees: numRupees(e, "paidAmountRupees", "paidAmountPaise", "paidAmount"),
    remainingRupees: numRupees(e, "remainingRupees", "remainingPaise", "remaining"),
    paidPercent: Number(e.paidPercent ?? 0) || 0,
    balanceStatus: String(e.balanceStatus ?? "PENDING").toUpperCase(),
    pricingRuleVersion: settlement.pricingRuleVersion,
    payoutModel: settlement.payoutModel,
    grossPricePaise: settlement.grossPricePaise,
    bookingPaise: settlement.bookingPaise,
    balancePaise: settlement.balancePaise,
    payoutPaise: settlement.payoutPaise,
    platformFeePaise: settlement.platformFeePaise,
    grossPriceRupees: settlement.grossPriceRupees,
    bookingRupees: settlement.bookingRupees,
    balanceRupees: settlement.balanceRupees,
    payoutRupees: settlement.payoutRupees,
    platformFeeRupees: settlement.platformFeeRupees,
  };
}

/**
 * @param {any} raw
 * @param {any} [summaryFallback]
 */
export function mapCadPayoutPayment(raw, summaryFallback) {
  const p = raw ?? {};
  const summaryPending = numRupees(
    summaryFallback ?? {},
    "pendingPaymentRupees",
    "pendingPaymentPaise",
    "pendingPayment"
  );
  const maxPayable =
    numRupees(p, "maxPayableRupees", "maxPayablePaise", "maxPayable") || summaryPending;
  return {
    maxPayable,
    canPayFull: p.canPayFull === true || (p.canPayFull == null && maxPayable > 0),
  };
}

/**
 * @param {any} raw
 */
export function mapCadPayoutAssignment(raw) {
  const a = raw ?? {};
  return {
    assignmentId: a.assignmentId ?? "",
    applicationId: a.applicationId ?? "—",
    surveyNo: a.surveyNo ?? "—",
    status: a.status ?? "—",
    completedAt: a.completedAt ?? null,
    assignmentEarnedRupees: numRupees(
      a,
      "assignmentEarnedRupees",
      "assignmentEarnedPaise",
      "assignmentEarned"
    ),
    assignmentPaidRupees: numRupees(
      a,
      "assignmentPaidRupees",
      "assignmentPaidPaise",
      "assignmentPaid"
    ),
    assignmentRemainingRupees: numRupees(
      a,
      "assignmentRemainingRupees",
      "assignmentRemainingPaise",
      "assignmentRemaining"
    ),
    entries: (Array.isArray(a.entries) ? a.entries : []).map(mapCadPayoutEntry),
  };
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
 * @param {any} raw
 */
export function mapCadUserPendingItem(raw) {
  const r = raw ?? {};
  const cadUser = r.cadUser ?? r.user ?? {};
  const summary = mapWalletSummary(r.summary ?? {});
  return {
    cadUser,
    cadUserId: cadUser._id ?? cadUser.id ?? r.cadUserId ?? "",
    summary,
    statistics: mapCadPayoutStatistics(r.statistics ?? {}),
    payment: mapCadPayoutPayment(r.payment, r.summary ?? summary),
    pendingEntryCount: Number(r.pendingEntryCount ?? 0) || 0,
    assignments: (Array.isArray(r.assignments) ? r.assignments : []).map(mapCadPayoutAssignment),
  };
}

/**
 * @param {any} raw — API envelope or inner `data`
 * @param {{ cadUserId?: string }} [options]
 */
export function mapCadWalletPendingSummaryResponse(raw, options = {}) {
  const { cadUserId } = options;
  const envelope = raw?.data ?? raw ?? {};
  const root =
    envelope?.data != null &&
    envelope?.cadUser == null &&
    !Array.isArray(envelope?.cadUsers) &&
    envelope?.summary == null
      ? envelope.data
      : envelope;

  const normalizeSingle = (singleRoot, payoutMetaSource = singleRoot) => {
    const item = mapCadUserPendingItem(singleRoot);
    const settlement = mapLedgerSettlement({
      ...(payoutMetaSource?.statistics ?? {}),
      ...(singleRoot?.statistics ?? {}),
      payoutPercent:
        singleRoot?.statistics?.payoutPercent ??
        payoutMetaSource?.statistics?.payoutPercent ??
        payoutMetaSource?.payoutPercent,
      payoutModel:
        singleRoot?.statistics?.payoutModel ??
        singleRoot?.payoutModel ??
        payoutMetaSource?.statistics?.payoutModel ??
        payoutMetaSource?.payoutModel,
      pricingRuleVersion:
        singleRoot?.statistics?.pricingRuleVersion ??
        singleRoot?.pricingRuleVersion ??
        payoutMetaSource?.statistics?.pricingRuleVersion ??
        payoutMetaSource?.pricingRuleVersion,
      payoutRupees:
        singleRoot?.statistics?.payoutRupees ??
        payoutMetaSource?.statistics?.payoutRupees ??
        payoutMetaSource?.payoutRupees,
      payoutPaise:
        singleRoot?.statistics?.payoutPaise ??
        payoutMetaSource?.statistics?.payoutPaise ??
        payoutMetaSource?.payoutPaise,
    });
    return {
      type: "single",
      ...item,
      /** @deprecated Prefer payoutModel + business-rules. */
      payoutPercent:
        Number(
          singleRoot?.statistics?.payoutPercent ??
            payoutMetaSource?.statistics?.payoutPercent ??
            payoutMetaSource?.payoutPercent ??
            0
        ) || 0,
      payoutModel: settlement.payoutModel ?? item.statistics?.payoutModel ?? null,
      payoutRupees: settlement.payoutRupees ?? item.statistics?.payoutRupees ?? null,
      pricingRuleVersion:
        settlement.pricingRuleVersion ?? item.statistics?.pricingRuleVersion ?? null,
    };
  };

  if (root.cadUser && !Array.isArray(root.cadUsers)) {
    return normalizeSingle(root);
  }

  if (cadUserId && Array.isArray(root.cadUsers)) {
    const match = root.cadUsers.find((item) => {
      const id =
        item?.cadUserId ??
        item?.cadUser?._id ??
        item?.cadUser?.id ??
        item?._id ??
        item?.id;
      return id != null && String(id) === String(cadUserId);
    });
    if (match) {
      return normalizeSingle(
        {
          ...match,
          assignments: match.assignments ?? root.assignments,
          payment: match.payment ?? root.payment,
        },
        root
      );
    }
  }

  if (cadUserId && (root.summary || root.statistics || root.payment)) {
    return normalizeSingle(root);
  }

  const statistics = mapCadPayoutStatistics(root.statistics ?? {});
  const listSettlement = mapLedgerSettlement({
    ...statistics,
    payoutPercent: root.payoutPercent ?? statistics.payoutPercent,
    payoutModel: root.payoutModel ?? statistics.payoutModel,
    pricingRuleVersion: root.pricingRuleVersion ?? statistics.pricingRuleVersion,
    payoutRupees: root.payoutRupees ?? statistics.payoutRupees,
    payoutPaise: root.payoutPaise ?? statistics.payoutPaise,
  });
  return {
    type: "list",
    /** @deprecated Prefer payoutModel + business-rules. */
    payoutPercent:
      Number(root.payoutPercent ?? statistics.payoutPercent ?? 0) || 0,
    payoutModel: listSettlement.payoutModel ?? statistics.payoutModel ?? null,
    payoutRupees: listSettlement.payoutRupees ?? statistics.payoutRupees ?? null,
    pricingRuleVersion:
      listSettlement.pricingRuleVersion ?? statistics.pricingRuleVersion ?? null,
    totalPending: Number(root.totalPending ?? root.totalPendingRupees ?? 0) || 0,
    statistics,
    cadUsers: (Array.isArray(root.cadUsers) ? root.cadUsers : []).map(mapCadUserPendingItem),
  };
}

/**
 * GET /api/admin/cad-wallet/pending-summary
 * @param {string} [cadUserId] — omit to list all CAD users with open balance
 */
export async function getCadWalletPendingSummary(cadUserId) {
  try {
    const params = cadUserId ? { cadUserId } : undefined;
    const { data } = await apiClient.get("/api/admin/cad-wallet/pending-summary", { params });
    return mapCadWalletPendingSummaryResponse(data, { cadUserId });
  } catch (e) {
    handleError(e, "Failed to load pending payout summary");
  }
}

/**
 * POST /api/admin/cad-wallet/pay-user
 * @param {{ cadUserId: string, amount?: number, amountRupees?: number, amountPaise?: number, payFull?: boolean }} body
 */
export async function payCadUser(body) {
  const { cadUserId, amount, amountRupees, amountPaise, payFull } = body ?? {};
  const payload = { cadUserId };

  if (payFull) {
    payload.payFull = true;
  } else {
    const rupees =
      amountRupees != null ? Number(amountRupees) : amount != null ? Number(amount) : null;
    if (rupees != null && Number.isFinite(rupees)) {
      payload.amountRupees = rupees;
    } else if (amountPaise != null) {
      payload.amountPaise = Number(amountPaise);
    }
  }

  try {
    const { data } = await apiClient.post("/api/admin/cad-wallet/pay-user", payload);
    return mapPayCadUserResponse(data);
  } catch (e) {
    handleError(e, "Failed to pay CAD user");
  }
}
