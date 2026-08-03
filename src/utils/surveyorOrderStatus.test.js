import { describe, expect, it } from "vitest";
import {
  getSurveyorOrderBucket,
  getSurveyorOrderStatusQuery,
  SURVEYOR_ACTIVE_STATUSES,
  SURVEYOR_COMPLETED_STATUSES,
  SURVEYOR_CANCELLED_STATUSES,
  resolveSurveyorOrderCounts,
} from "./surveyorOrderStatus.js";

describe("surveyorOrderStatus buckets (BIZ-10 terminals)", () => {
  it("completed is APPROVED only; cancelled is REJECTED", () => {
    expect(SURVEYOR_COMPLETED_STATUSES).toEqual(["APPROVED"]);
    expect(SURVEYOR_CANCELLED_STATUSES).toEqual(["REJECTED"]);
    expect(getSurveyorOrderStatusQuery("completed")).toBe("APPROVED");
    expect(getSurveyorOrderStatusQuery("cancelled")).toBe("REJECTED");
  });

  it("keeps CAD_DELIVERED in active until admin review", () => {
    expect(SURVEYOR_ACTIVE_STATUSES).toContain("CAD_DELIVERED");
    expect(getSurveyorOrderBucket("CAD_DELIVERED")).toBe("active");
    expect(getSurveyorOrderBucket("APPROVED")).toBe("completed");
    expect(getSurveyorOrderBucket("REJECTED")).toBe("cancelled");
  });

  it("sums byStatus with CAD_DELIVERED under active", () => {
    const counts = resolveSurveyorOrderCounts({
      byStatus: {
        PENDING: 2,
        CAD_DELIVERED: 3,
        APPROVED: 4,
        REJECTED: 1,
      },
    });
    expect(counts.active).toBe(5);
    expect(counts.completed).toBe(4);
    expect(counts.cancelled).toBe(1);
  });
});
