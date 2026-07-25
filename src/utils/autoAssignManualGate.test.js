import { describe, expect, it } from "vitest";
import {
  formatAutoAssignActiveHint,
  formatManualAssignBlockedMessage,
  normalizeAssignmentFlow,
  normalizeAutoAssignAttempts,
  normalizeAutoAssignExceptions,
  normalizeManualAssignGate,
  parseManualAssignBlocked,
  resolveManualAssignUi,
} from "../../utils/autoAssignManualGate.js";

describe("normalizeAssignmentFlow", () => {
  it("reads autoAssignEnabled, policy, exceptionQueueTotal, manualAssignHint", () => {
    const flow = normalizeAssignmentFlow({
      autoAssignEnabled: true,
      policy: { maxAttempts: 5, retryBaseMs: 1000, manualOverrideMs: 60000 },
      exceptionQueueTotal: 3,
      manualAssignHint: "Override after timeout",
    });
    expect(flow.autoAssignEnabled).toBe(true);
    expect(flow.policy.maxAttempts).toBe(5);
    expect(flow.policy.retryBaseMs).toBe(1000);
    expect(flow.policy.manualOverrideMs).toBe(60000);
    expect(flow.exceptionQueueTotal).toBe(3);
    expect(flow.manualAssignHint).toBe("Override after timeout");
  });
});

describe("resolveManualAssignUi", () => {
  it("treats AUTO_ASSIGN_OFF as normal manual assign", () => {
    expect(
      resolveManualAssignUi({
        allowed: true,
        reason: "AUTO_ASSIGN_OFF",
      })
    ).toMatchObject({ showAssign: true, disabled: false, badge: null });
  });

  it("shows Needs manual assign badge for EXCEPTION_QUEUE / OVERRIDE_TIMEOUT", () => {
    expect(
      resolveManualAssignUi({ allowed: true, reason: "EXCEPTION_QUEUE" })
    ).toMatchObject({
      showAssign: true,
      disabled: false,
      badge: "Needs manual assign",
    });
    expect(
      resolveManualAssignUi({ allowed: true, reason: "OVERRIDE_TIMEOUT" })
    ).toMatchObject({
      showAssign: true,
      disabled: false,
      badge: "Needs manual assign",
    });
  });

  it("disables Assign while AUTO_ASSIGN_ACTIVE with override hint", () => {
    const at = "2026-07-25T12:00:00.000Z";
    const ui = resolveManualAssignUi({
      allowed: false,
      reason: "AUTO_ASSIGN_ACTIVE",
      manualOverrideAllowedAt: at,
    });
    expect(ui.showAssign).toBe(true);
    expect(ui.disabled).toBe(true);
    expect(ui.hint).toBe(formatAutoAssignActiveHint(at));
  });

  it("hides Assign when ALREADY_ASSIGNED", () => {
    expect(
      resolveManualAssignUi({
        allowed: false,
        reason: "ALREADY_ASSIGNED",
      })
    ).toMatchObject({ showAssign: false });
  });

  it("does not hard-disable solely because auto is on without a gate", () => {
    expect(resolveManualAssignUi(null)).toMatchObject({
      showAssign: false,
      loading: true,
    });
  });
});

describe("parseManualAssignBlocked", () => {
  it("reads override time from errors[0].manualOverrideAllowedAt", () => {
    const at = "2026-07-25T15:30:00.000Z";
    const parsed = parseManualAssignBlocked({
      data: {
        message: "MANUAL_ASSIGN_BLOCKED",
        errors: [
          {
            code: "MANUAL_ASSIGN_BLOCKED",
            manualOverrideAllowedAt: at,
            message: "Wait for override window",
          },
        ],
      },
    });
    expect(parsed.blocked).toBe(true);
    expect(parsed.manualOverrideAllowedAt).toBe(at);
    expect(parsed.message).toBe(formatManualAssignBlockedMessage(at));
  });
});

describe("normalizeManualAssignGate", () => {
  it("normalizes reason aliases", () => {
    expect(normalizeManualAssignGate({ allowed: true, code: "exception_queue" })).toEqual(
      expect.objectContaining({ allowed: true, reason: "EXCEPTION_QUEUE" })
    );
  });
});

describe("normalizeAutoAssignExceptions / attempts", () => {
  it("normalizes exception rows", () => {
    const { items, meta } = normalizeAutoAssignExceptions({
      data: [
        {
          uploadId: "u1",
          applicationId: "APP-1",
          status: "PENDING_RETRY",
          failureReason: "No CAD available",
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(items[0]).toMatchObject({
      uploadId: "u1",
      applicationId: "APP-1",
      status: "PENDING_RETRY",
      failureReason: "No CAD available",
    });
    expect(meta.total).toBe(1);
  });

  it("normalizes attempts list", () => {
    const attempts = normalizeAutoAssignAttempts({
      attempts: [{ attemptNumber: 1, status: "FAILED", failureReason: "timeout" }],
    });
    expect(attempts[0]).toMatchObject({
      attemptNumber: 1,
      status: "FAILED",
      failureReason: "timeout",
    });
  });
});
