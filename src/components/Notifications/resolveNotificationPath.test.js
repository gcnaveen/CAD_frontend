import { describe, expect, it } from "vitest";
import { resolveNotificationPath } from "./resolveNotificationPath.js";

describe("resolveNotificationPath (NOTIF-01)", () => {
  it("deep-links SKETCH_PAYMENT_PENDING to Retry Payment on surveyor home", () => {
    expect(
      resolveNotificationPath("user", "SKETCH_UPLOAD", {
        type: "SKETCH_PAYMENT_PENDING",
        entityId: "upl_123",
      })
    ).toBe("/dashboard/user?uploadId=upl_123&action=retryPayment");
  });

  it("opens order drawer for sketch entity without payment type", () => {
    expect(
      resolveNotificationPath("user", "SKETCH_UPLOAD", {
        type: "SURVEY_SKETCH_DELIVERED",
        entityId: "upl_9",
      })
    ).toBe("/dashboard/user?uploadId=upl_9");
  });

  it("routes CAD assignment notifications to current orders", () => {
    expect(
      resolveNotificationPath("cad", "ORDER", {
        type: "SURVEY_SKETCH_ASSIGNED",
      })
    ).toBe("/dashboard/cad/current-orders");
  });
});
