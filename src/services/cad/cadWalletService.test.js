import { describe, expect, it } from "vitest";
import { mapOrderStats } from "./cadWalletService.js";
import {
  normalizePublicBusinessRules,
  normalizeSupportContact,
} from "../public/businessRulesService.js";

describe("mapOrderStats (CAD-03)", () => {
  it("maps additive pendingAcceptOrders / completedOrders / countSemantics", () => {
    const stats = mapOrderStats({
      totalOrders: 10,
      acceptedOrders: 7,
      rejectedOrders: 1,
      inProgressOrders: 2,
      pendingAcceptOrders: 3,
      completedOrders: 4,
      countSemantics: { acceptedOrders: "lifetime accepted" },
    });
    expect(stats.pendingAcceptOrders).toBe(3);
    expect(stats.completedOrders).toBe(4);
    expect(stats.acceptedOrders).toBe(7);
    expect(stats.countSemantics?.acceptedOrders).toBe("lifetime accepted");
  });

  it("defaults additive counts to 0", () => {
    const stats = mapOrderStats({ totalOrders: 1, acceptedOrders: 1 });
    expect(stats.pendingAcceptOrders).toBe(0);
    expect(stats.completedOrders).toBe(0);
  });
});

describe("supportContact (SUPPORT-01)", () => {
  it("normalizes supportContact from business-rules", () => {
    const contact = normalizeSupportContact({
      supportContact: {
        whatsappUrl: "https://api.whatsapp.com/send/?phone=919999999999",
        email: "support@northcot.in",
        whatsappNumber: "919999999999",
      },
    });
    expect(contact.whatsappUrl).toContain("919999999999");
    expect(contact.email).toBe("support@northcot.in");
  });

  it("builds URL from number when url missing", () => {
    const contact = normalizeSupportContact({
      supportContact: { whatsappNumber: "91 98765 43210" },
    });
    expect(contact.whatsappNumber).toBe("919876543210");
    expect(contact.whatsappUrl).toContain("919876543210");
  });

  it("includes supportContact on normalizePublicBusinessRules", () => {
    const rules = normalizePublicBusinessRules({
      supportContact: { email: "support@northcot.in", whatsappNumber: "919945831469" },
    });
    expect(rules.supportContact.email).toBe("support@northcot.in");
    expect(rules.supportContact.whatsappUrl).toBeTruthy();
  });
});
