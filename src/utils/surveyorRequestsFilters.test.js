/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  sortOrdersNewestFirst,
  isOrderInDateRange,
  buildTodayRange,
  buildThisWeekRange,
  buildThisMonthRange,
  buildLastMonthRange,
  buildDatePresetRange,
  buildSurveyorOrdersListParams,
} from "./surveyorRequestsFilters.js";

describe("sortOrdersNewestFirst", () => {
  it("sorts by createdAt descending (newest first)", () => {
    const rows = [
      { _id: "a", createdAt: "2026-01-01T10:00:00.000Z" },
      { _id: "b", createdAt: "2026-03-15T10:00:00.000Z" },
      { _id: "c", createdAt: "2026-02-10T10:00:00.000Z" },
    ];
    expect(sortOrdersNewestFirst(rows).map((r) => r._id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const rows = [
      { _id: "a", createdAt: "2026-01-01T10:00:00.000Z" },
      { _id: "b", createdAt: "2026-03-15T10:00:00.000Z" },
    ];
    const copy = [...rows];
    sortOrdersNewestFirst(rows);
    expect(rows).toEqual(copy);
  });

  it("treats missing createdAt as oldest", () => {
    const rows = [
      { _id: "a" },
      { _id: "b", createdAt: "2026-03-15T10:00:00.000Z" },
    ];
    expect(sortOrdersNewestFirst(rows).map((r) => r._id)).toEqual(["b", "a"]);
  });
});

describe("isOrderInDateRange", () => {
  const row = { createdAt: "2026-03-15T14:30:00.000Z" };

  it("returns true when no from/to set", () => {
    expect(isOrderInDateRange(row, "", "")).toBe(true);
    expect(isOrderInDateRange(row, null, null)).toBe(true);
  });

  it("includes orders on the from date (inclusive)", () => {
    expect(isOrderInDateRange(row, "2026-03-15", "")).toBe(true);
    expect(isOrderInDateRange(row, "2026-03-16", "")).toBe(false);
  });

  it("includes orders on the to date (inclusive)", () => {
    expect(isOrderInDateRange(row, "", "2026-03-15")).toBe(true);
    expect(isOrderInDateRange(row, "", "2026-03-14")).toBe(false);
  });

  it("filters by from–to range inclusive", () => {
    expect(isOrderInDateRange(row, "2026-03-01", "2026-03-31")).toBe(true);
    expect(isOrderInDateRange(row, "2026-03-01", "2026-03-14")).toBe(false);
  });
});

describe("date presets", () => {
  const now = new Date(2026, 2, 24); // Tue Mar 24, 2026 local

  it("buildTodayRange is today–today", () => {
    expect(buildTodayRange(now)).toEqual({ from: "2026-03-24", to: "2026-03-24" });
  });

  it("buildThisWeekRange is Monday through today (ISO week)", () => {
    // Mon Mar 23 – Tue Mar 24
    expect(buildThisWeekRange(now)).toEqual({ from: "2026-03-23", to: "2026-03-24" });
  });

  it("buildThisWeekRange on Sunday uses that week's Monday", () => {
    const sunday = new Date(2026, 2, 22); // Sun Mar 22
    expect(buildThisWeekRange(sunday)).toEqual({ from: "2026-03-16", to: "2026-03-22" });
  });

  it("buildThisMonthRange is first of month through today", () => {
    expect(buildThisMonthRange(now)).toEqual({ from: "2026-03-01", to: "2026-03-24" });
  });

  it("buildLastMonthRange is full previous calendar month", () => {
    expect(buildLastMonthRange(now)).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("buildLastMonthRange handles January → previous December", () => {
    expect(buildLastMonthRange(new Date(2026, 0, 10))).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("buildDatePresetRange dispatches known presets", () => {
    expect(buildDatePresetRange("today", now)).toEqual(buildTodayRange(now));
    expect(buildDatePresetRange("week", now)).toEqual(buildThisWeekRange(now));
    expect(buildDatePresetRange("month", now)).toEqual(buildThisMonthRange(now));
    expect(buildDatePresetRange("lastMonth", now)).toEqual(buildLastMonthRange(now));
  });
});

describe("buildSurveyorOrdersListParams", () => {
  it("adds newest-first sort and page defaults for all tab", () => {
    expect(buildSurveyorOrdersListParams({ tab: "all" })).toEqual({
      bucket: "all",
      page: 1,
      limit: 50,
      sort: "createdAt",
      order: "desc",
    });
  });

  it("includes from/to when provided", () => {
    expect(
      buildSurveyorOrdersListParams({
        tab: "all",
        from: "2026-03-01",
        to: "2026-03-24",
      })
    ).toMatchObject({
      from: "2026-03-01",
      to: "2026-03-24",
      sort: "createdAt",
      order: "desc",
    });
  });

  it("omits empty from/to", () => {
    const params = buildSurveyorOrdersListParams({
      tab: "active",
      statusQuery: "PAYMENT_PENDING,PENDING",
      from: "",
      to: "  ",
    });
    expect(params).not.toHaveProperty("from");
    expect(params).not.toHaveProperty("to");
    expect(params.status).toBe("PAYMENT_PENDING,PENDING");
  });
});
