/**
 * Client helpers for surveyor/public Requests list:
 * newest-first sort + from/to date range (calendar-day inclusive).
 */

function toTime(value) {
  const t = new Date(value || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** @param {string} ymd YYYY-MM-DD */
function startOfLocalDay(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

/** @param {string} ymd YYYY-MM-DD */
function endOfLocalDay(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** @param {Date} date */
export function formatLocalYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * @param {Array<{ createdAt?: string }>} rows
 * @returns {typeof rows}
 */
export function sortOrdersNewestFirst(rows) {
  if (!Array.isArray(rows)) return [];
  return [...rows].sort((a, b) => toTime(b?.createdAt) - toTime(a?.createdAt));
}

/**
 * Inclusive calendar-day range on createdAt (local timezone).
 * @param {{ createdAt?: string }} row
 * @param {string|null|undefined} from YYYY-MM-DD
 * @param {string|null|undefined} to YYYY-MM-DD
 */
export function isOrderInDateRange(row, from, to) {
  const fromYmd = typeof from === "string" ? from.trim() : "";
  const toYmd = typeof to === "string" ? to.trim() : "";
  if (!fromYmd && !toYmd) return true;

  const created = toTime(row?.createdAt);
  if (!created) return false;

  if (fromYmd && created < startOfLocalDay(fromYmd)) return false;
  if (toYmd && created > endOfLocalDay(toYmd)) return false;
  return true;
}

/**
 * @param {Date} [now]
 * @returns {{ from: string, to: string }}
 */
export function buildTodayRange(now = new Date()) {
  const ymd = formatLocalYmd(now);
  return { from: ymd, to: ymd };
}

/**
 * ISO week: Monday through today (local).
 * @param {Date} [now]
 * @returns {{ from: string, to: string }}
 */
export function buildThisWeekRange(now = new Date()) {
  const day = now.getDay(); // 0 Sun … 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysFromMonday);
  return {
    from: formatLocalYmd(monday),
    to: formatLocalYmd(now),
  };
}

/**
 * @param {Date} [now]
 * @returns {{ from: string, to: string }}
 */
export function buildThisMonthRange(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: formatLocalYmd(first),
    to: formatLocalYmd(now),
  };
}

/**
 * Full previous calendar month.
 * @param {Date} [now]
 * @returns {{ from: string, to: string }}
 */
export function buildLastMonthRange(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    from: formatLocalYmd(first),
    to: formatLocalYmd(last),
  };
}

/** @typedef {"today" | "week" | "month" | "lastMonth"} DatePresetId */

/**
 * @param {DatePresetId} preset
 * @param {Date} [now]
 * @returns {{ from: string, to: string }}
 */
export function buildDatePresetRange(preset, now = new Date()) {
  switch (preset) {
    case "today":
      return buildTodayRange(now);
    case "week":
      return buildThisWeekRange(now);
    case "month":
      return buildThisMonthRange(now);
    case "lastMonth":
      return buildLastMonthRange(now);
    default:
      return { from: "", to: "" };
  }
}

/**
 * Query params for GET /api/surveyor/orders (Requests page).
 * @param {{
 *   tab?: string,
 *   statusQuery?: string,
 *   from?: string,
 *   to?: string,
 *   page?: number,
 *   limit?: number,
 * }} opts
 */
export function buildSurveyorOrdersListParams({
  tab = "all",
  statusQuery = "",
  from = "",
  to = "",
  page = 1,
  limit = 50,
} = {}) {
  const params =
    tab === "all"
      ? { bucket: "all", page, limit, sort: "createdAt", order: "desc" }
      : {
          status: statusQuery,
          page,
          limit,
          sort: "createdAt",
          order: "desc",
        };

  const fromYmd = typeof from === "string" ? from.trim() : "";
  const toYmd = typeof to === "string" ? to.trim() : "";
  if (fromYmd) params.from = fromYmd;
  if (toYmd) params.to = toYmd;
  return params;
}
