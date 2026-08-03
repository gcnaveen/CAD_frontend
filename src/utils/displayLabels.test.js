import { describe, expect, it } from "vitest";
import {
  getAutoAssignExceptionStatusLabel,
  getPayoutStatusLabel,
  humanizeEnumLabel,
} from "./displayLabels.js";

describe("displayLabels (COPY-03)", () => {
  it("maps known enums to friendly labels", () => {
    expect(humanizeEnumLabel("PENDING_RETRY")).toBe("Pending retry");
    expect(humanizeEnumLabel("EXCEPTION")).toBe("Exception");
    expect(getPayoutStatusLabel("PAID")).toBe("Paid");
    expect(getPayoutStatusLabel("PARTIAL")).toBe("Partial");
    expect(getAutoAssignExceptionStatusLabel("pending_retry")).toBe("Pending retry");
  });

  it("title-cases unknown SCREAMING_SNAKE values", () => {
    expect(humanizeEnumLabel("FOO_BAR_BAZ")).toBe("Foo Bar Baz");
  });

  it("handles empty values", () => {
    expect(humanizeEnumLabel(null)).toBe("—");
    expect(humanizeEnumLabel("")).toBe("—");
  });
});
