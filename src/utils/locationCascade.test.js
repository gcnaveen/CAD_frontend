/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  shouldResetCascade,
  shouldClearCascadeChildren,
  normalizeCascadeParentId,
} from "./locationCascade.js";

describe("shouldResetCascade", () => {
  it("does not reset on first observation (remount / initial mount)", () => {
    expect(shouldResetCascade(undefined, "dist-1")).toBe(false);
    expect(shouldResetCascade(undefined, null)).toBe(false);
  });

  it("does not reset when parent id is unchanged", () => {
    expect(shouldResetCascade("dist-1", "dist-1")).toBe(false);
    expect(shouldResetCascade(null, null)).toBe(false);
  });

  it("resets when parent id changes", () => {
    expect(shouldResetCascade("dist-1", "dist-2")).toBe(true);
    expect(shouldResetCascade("dist-1", null)).toBe(true);
    expect(shouldResetCascade(null, "dist-1")).toBe(true);
  });
});

describe("shouldClearCascadeChildren", () => {
  it("keeps children on remount hydration (null → id with children already set)", () => {
    expect(
      shouldClearCascadeChildren({
        prevParentId: null,
        nextParentId: "d1",
        hasExistingChildren: true,
      })
    ).toBe(false);
  });

  it("clears when parent actually changes between two ids", () => {
    expect(
      shouldClearCascadeChildren({
        prevParentId: "d1",
        nextParentId: "d2",
        hasExistingChildren: true,
      })
    ).toBe(true);
  });

  it("respects keepPrefill", () => {
    expect(
      shouldClearCascadeChildren({
        prevParentId: null,
        nextParentId: "d1",
        hasExistingChildren: false,
        keepPrefill: true,
      })
    ).toBe(false);
  });
});

describe("normalizeCascadeParentId", () => {
  it("normalizes strings, objects, and empty values", () => {
    expect(normalizeCascadeParentId("abc")).toBe("abc");
    expect(normalizeCascadeParentId({ id: "x" })).toBe("x");
    expect(normalizeCascadeParentId({ _id: "y" })).toBe("y");
    expect(normalizeCascadeParentId("")).toBe(null);
    expect(normalizeCascadeParentId(null)).toBe(null);
    expect(normalizeCascadeParentId(undefined)).toBe(null);
  });
});
