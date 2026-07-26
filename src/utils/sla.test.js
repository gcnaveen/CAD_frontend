import { describe, expect, it } from "vitest";
import {
  SLA_STATES,
  SLA_AWAITING_MESSAGE,
  formatSlaDueAt,
  formatSlaRemaining,
  getSlaRiskTone,
  getSlaStateLabel,
  isSlaAwaitingAssignment,
  normalizeOpsSlaItems,
  normalizeSla,
  pickSlaRaw,
  resolveSla,
} from "./sla.js";

describe("pickSlaRaw / resolveSla", () => {
  it("prefers assignment.sla over top-level sla", () => {
    const entity = {
      sla: { state: "AWAITING_ASSIGNMENT", dueAt: null },
      assignment: { sla: { state: "WARNING", dueAt: "2026-07-26T12:00:00.000Z", remainingHours: 6 } },
    };
    expect(pickSlaRaw(entity).state).toBe("WARNING");
    expect(resolveSla(entity).state).toBe("WARNING");
    expect(resolveSla(entity).remainingHours).toBe(6);
  });

  it("falls back to top-level sla on surveyor orders", () => {
    const sla = resolveSla({
      sla: { state: "AWAITING_ASSIGNMENT", dueAt: null, publicPromise: "48h after assign" },
    });
    expect(sla.state).toBe(SLA_STATES.AWAITING_ASSIGNMENT);
    expect(sla.dueAt).toBeNull();
    expect(sla.publicPromise).toBe("48h after assign");
  });
});

describe("normalizeSla", () => {
  it("does not invent dueAt or remaining from a local clock", () => {
    const sla = normalizeSla({ state: "ON_TRACK" });
    expect(sla.dueAt).toBeNull();
    expect(sla.remainingMs).toBeNull();
    expect(sla.remainingHours).toBeNull();
  });

  it("derives remainingHours from remainingMs when only ms is present", () => {
    const sla = normalizeSla({ state: "ON_TRACK", remainingMs: 3 * 60 * 60 * 1000 });
    expect(sla.remainingHours).toBe(3);
  });
});

describe("awaiting assignment", () => {
  it("detects AWAITING_ASSIGNMENT and exposes copy", () => {
    const sla = normalizeSla({ state: "AWAITING_ASSIGNMENT", dueAt: null });
    expect(isSlaAwaitingAssignment(sla)).toBe(true);
    expect(SLA_AWAITING_MESSAGE).toMatch(/assigned to CAD/i);
  });
});

describe("format helpers", () => {
  it("formats dueAt in Asia/Kolkata", () => {
    const text = formatSlaDueAt("2026-07-25T18:30:00.000Z");
    expect(text).toBeTruthy();
    expect(text).not.toBe("2026-07-25T18:30:00.000Z");
  });

  it("formats remaining from API hours only", () => {
    expect(formatSlaRemaining({ remainingHours: 12.4 })).toMatch(/12h left/);
    expect(formatSlaRemaining({ remainingHours: -2 })).toMatch(/overdue/);
  });

  it("labels and tones warning / escalated / breached", () => {
    expect(getSlaStateLabel("WARNING")).toBe("Warning");
    expect(getSlaRiskTone("WARNING")).toBe("warning");
    expect(getSlaRiskTone("ESCALATED")).toBe("escalated");
    expect(getSlaRiskTone("BREACHED")).toBe("breached");
    expect(getSlaRiskTone("ON_TRACK")).toBeNull();
  });
});

describe("normalizeOpsSlaItems", () => {
  it("preserves API order and maps state", () => {
    const items = normalizeOpsSlaItems([
      { orderId: "a", state: "BREACHED", ageHours: 50 },
      { orderId: "b", state: "WARNING", remainingHours: 4 },
      { orderId: "c", breached: false, ageHours: 10 },
    ]);
    expect(items.map((r) => r.orderId)).toEqual(["a", "b", "c"]);
    expect(items[0].state).toBe("BREACHED");
    expect(items[1].state).toBe("WARNING");
    expect(items[2].state).toBe("ON_TRACK");
  });
});
