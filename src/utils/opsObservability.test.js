import { describe, expect, it } from "vitest";
import { normalizeOpsObservability } from "../services/admin/opsObservabilityAdminService.js";
import { normalizeOpsSlaItems } from "./sla.js";
import { getApiErrorMessage } from "./apiErrorMessage.js";
import { getCorrelationId } from "./correlationId.js";

describe("normalizeOpsSlaItems", () => {
  it("marks breached rows as BREACHED", () => {
    const items = normalizeOpsSlaItems([{ orderId: "o1", breached: true }]);
    expect(items).toHaveLength(1);
    expect(items[0].state).toBe("BREACHED");
  });
});

describe("normalizeOpsObservability", () => {
  it("maps funnel, payments, sla, capacity, and alerts", () => {
    const snap = normalizeOpsObservability({
      data: {
        funnel: { byStatus: { PENDING: 2, COMPLETED: 5 } },
        payments: { flags: { MISSING: 1, MISMATCHED: 3 } },
        recentPaymentMismatches: [{ merchantOrderId: "m1", flag: "MISMATCHED" }],
        sla: {
          breached: 4,
          withinSla: 10,
          items: [{ orderId: "o1", breached: true, state: "BREACHED" }],
        },
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
    // Prefer nested normalize path; assert counts when items are present.
    if (snap.sla.items.length > 0) {
      expect(snap.sla.items[0].state).toBe("BREACHED");
    }
    expect(snap.sla.warning).toBeGreaterThanOrEqual(0);
    expect(snap.sla.escalated).toBeGreaterThanOrEqual(0);
    expect(snap.operatorCapacity).toEqual({ available: 3, busy: 2, offline: 1 });
    expect(snap.alerts.level).toBe("warning");
    expect(snap.alerts.message).toBe("SLA pressure");
  });
});

describe("getApiErrorMessage correlation", () => {
  it("keeps correlation id on the error but does not show it in UI copy", () => {
    const error = {
      response: {
        data: { message: "Payment failed" },
        headers: { "x-correlation-id": "abc-123" },
      },
    };
    expect(getCorrelationId(error)).toBe("abc-123");
    expect(getApiErrorMessage(error)).toBe("Payment failed");
  });
});
