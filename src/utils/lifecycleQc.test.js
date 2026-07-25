/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import spec from "../../docs/LIFECYCLE_QC_SPEC_M08.json";
import {
  FALLBACK_LIFECYCLE_MACHINE,
  FALLBACK_QC,
  analyticsKeyForStatus,
  canonicalizeSketchStatus,
  getAnalyticsKeys,
  getNotificationTriggers,
  getQcApprovedCopy,
  getSketchStatusLabel,
  isKnownNotificationTrigger,
  normalizeLifecycleMachine,
  normalizeQc,
  normalizeSurveySketchStatusesPayload,
  notificationTriggerForStatus,
} from "./lifecycleQc.js";
import { normalizePublicBusinessRules } from "../services/public/businessRulesService.js";
import { getSurveyorOrderStatusLabel } from "./surveyorOrderStatus.js";

describe("LIFECYCLE_QC_SPEC_M08 snapshot", () => {
  it("matches FALLBACK_LIFECYCLE_MACHINE + FALLBACK_QC", () => {
    expect(FALLBACK_LIFECYCLE_MACHINE).toEqual(spec.lifecycleMachine);
    expect(FALLBACK_QC).toEqual(spec.qc);
  });

  it("qc.checkCount is always 10", () => {
    expect(FALLBACK_QC.checkCount).toBe(10);
    expect(normalizeQc({ checkCount: 6 }).checkCount).toBe(10);
    expect(normalizeQc({ checkCount: 10 }).checkCount).toBe(10);
  });
});

describe("sketch status labels (M-08)", () => {
  it("uses lifecycleMachine.labels only", () => {
    expect(getSketchStatusLabel("PAYMENT_PENDING")).toBe("Awaiting booking payment");
    expect(getSketchStatusLabel("PENDING")).toBe("Queued for assignment");
    expect(getSketchStatusLabel("ASSIGNED")).toBe("With CAD");
    expect(getSketchStatusLabel("CAD_DELIVERED")).toBe("Delivered (balance may apply)");
    expect(getSketchStatusLabel("UNDER_REVISION")).toBe("Revision in flight");
    expect(getSketchStatusLabel("APPROVED")).toBe("Completed");
    expect(getSketchStatusLabel("REJECTED")).toBe("Cancelled");
  });

  it("maps legacy UNDER_REVIEW → UNDER_REVISION", () => {
    expect(canonicalizeSketchStatus("UNDER_REVIEW")).toBe("UNDER_REVISION");
    expect(getSketchStatusLabel("UNDER_REVIEW")).toBe("Revision in flight");
    expect(getSurveyorOrderStatusLabel("UNDER_REVIEW")).toBe("Revision in flight");
  });
});

describe("notificationTriggers + analyticsKeys", () => {
  it("exposes payload keys without inventing parallel enums", () => {
    expect(getNotificationTriggers()).toEqual(
      FALLBACK_LIFECYCLE_MACHINE.notificationTriggers
    );
    expect(getAnalyticsKeys()).toEqual(FALLBACK_LIFECYCLE_MACHINE.analyticsKeys);
    expect(isKnownNotificationTrigger("sketch.assigned")).toBe(true);
    expect(isKnownNotificationTrigger("made_up_event")).toBe(false);
  });

  it("resolves keys per status from the same payload", () => {
    expect(analyticsKeyForStatus("ASSIGNED")).toBe("lifecycle.assigned");
    expect(notificationTriggerForStatus("CAD_DELIVERED")).toBe(
      "sketch.cad_delivered"
    );
    expect(analyticsKeyForStatus("UNDER_REVIEW")).toBe("lifecycle.under_revision");
  });
});

describe("normalizePublicBusinessRules", () => {
  it("includes lifecycleMachine + qc from API", () => {
    const rules = normalizePublicBusinessRules({
      cadOperatorEarnings: { model: "FIXED", payoutRupees: 400 },
      lifecycleMachine: {
        labels: { PENDING: "Queued for assignment" },
        sketchStatuses: [{ code: "PENDING", label: "Queued for assignment" }],
        legacySketchStatusMap: { UNDER_REVIEW: "UNDER_REVISION" },
        notificationTriggers: ["sketch.queued"],
        analyticsKeys: ["lifecycle.pending"],
      },
      qc: {
        checkCount: 10,
        checklistId: "11E",
        approvedCopy: "Every drawing is QC-checked against the approved 11E 10-point checklist before release.",
      },
    });
    expect(rules.lifecycleMachine.labels.PENDING).toBe("Queued for assignment");
    expect(rules.qc.checkCount).toBe(10);
    expect(getQcApprovedCopy(rules.qc)).toContain("11E 10-point");
  });

  it("falls back to snapshot when lifecycle/qc omitted", () => {
    const rules = normalizePublicBusinessRules({});
    expect(rules.lifecycleMachine.labels.APPROVED).toBe("Completed");
    expect(rules.qc.checkCount).toBe(10);
  });
});

describe("normalizeSurveySketchStatusesPayload (admin)", () => {
  it("returns enums, labels, transitions, and QC", () => {
    const out = normalizeSurveySketchStatusesPayload({
      statuses: [
        { value: "PENDING", label: "Queued for assignment" },
        { value: "UNDER_REVIEW", label: "ignored — remapped" },
      ],
      transitions: { PENDING: ["ASSIGNED", "REJECTED"] },
      qc: { checkCount: 10, checklistId: "11E" },
    });
    expect(out.statuses.find((s) => s.value === "PENDING")?.label).toBe(
      "Queued for assignment"
    );
    expect(out.statuses.find((s) => s.value === "UNDER_REVISION")).toBeTruthy();
    expect(out.transitions.PENDING).toEqual(["ASSIGNED", "REJECTED"]);
    expect(out.qc.checkCount).toBe(10);
    expect(out.labels.APPROVED).toBe("Completed");
  });
});

describe("normalizeLifecycleMachine", () => {
  it("prefers sketchStatuses[].label when labels omit a code", () => {
    const m = normalizeLifecycleMachine({
      sketchStatuses: [{ code: "ASSIGNED", label: "With CAD" }],
    });
    expect(m.labels.ASSIGNED).toBe("With CAD");
  });
});
