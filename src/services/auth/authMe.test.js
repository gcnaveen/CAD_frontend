import { describe, it, expect } from "vitest";
import { normalizeMeResponse } from "./authService.js";

describe("normalizeMeResponse", () => {
  it("reads { user, role } contract", () => {
    const out = normalizeMeResponse({
      success: true,
      data: { user: { id: "1", name: { first: "A" } }, role: "CAD" },
    });
    expect(out.role).toBe("CAD");
    expect(out.user.id).toBe("1");
    expect(out.user.role).toBe("CAD");
  });

  it("accepts flat user object", () => {
    const out = normalizeMeResponse({ id: "2", role: "SURVEYOR", phone: "9999999999" });
    expect(out.user.id).toBe("2");
    expect(out.role).toBe("SURVEYOR");
  });
});
