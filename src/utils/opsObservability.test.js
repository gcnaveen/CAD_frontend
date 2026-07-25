import { describe, expect, it } from "vitest";
import { normalizeOpsObservability } from "../services/admin/opsObservabilityAdminService.js";
import { getApiErrorMessage } from "./apiErrorMessage.js";
import { getCorrelationId } from "./correlationId.js";

describe("normalizeOpsObservability", () => {
  it("maps funnel, payments, sla, capacity, and alerts", () => {
    const snap = normalizeOpsObservability({
      data: {
        funnel: { byStatus: { PENDING: 2, COMPLETED: 5 } },
        payments: { flags: { MISSING: 1, MISMATCHED: 3 } },
        recentPaymentMismatches: [{ merchantOrderId: "m1", flag: "MISMATCHED" }],
        sla: { breached: 4, withinSla: 10, window: [{ orderId: "o1", breached: true }] },
        operatorCapacity: { available: 3, busy: 2, offline: 1 },
        alerts: { level: "warning", message: "SLA pressure", count: 4 },
      },
    });

    expect(snap.funnel.total).toBe(7);
    expect(snap.funnel.byStatus).toEqual([
      { status: "PENDING", count: 2 },
      { status: "COMPLETED", count: 5 },
    ]);
    expect(snap.payments.flags).toEqual([
      { flag: "MISSING", count: 1 },
      { flag: "MISMATCHED", count: 3 },
    ]);
    expect(snap.payments.recentPaymentMismatches).toHaveLength(1);
    expect(snap.sla).toMatchObject({ breached: 4, withinSla: 10, windowHours: 48 });
    expect(snap.sla.items[0].state).toBe("BREACHED");
    expect(snap.sla.warning).toBeGreaterThanOrEqual(0);
    expect(snap.sla.escalated).toBeGreaterThanOrEqual(0);
    expect(snap.operatorCapacity).toEqual({ available: 3, busy: 2, offline: 1 });
    expect(snap.alerts.level).toBe("warning");
    expect(snap.alerts.message).toBe("SLA pressure");
  });
});

describe("getApiErrorMessage correlation", () => {
  it("appends response correlation id for support refs", () => {
    const error = {
      response: {
        data: { message: "Payment failed" },
        headers: { "x-correlation-id": "abc-123" },
      },
    };
    expect(getCorrelationId(error)).toBe("abc-123");
    expect(getApiErrorMessage(error)).toBe("Payment failed (ref: abc-123)");
  });
});
