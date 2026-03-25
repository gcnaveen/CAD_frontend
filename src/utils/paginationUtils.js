/**
 * Extract list rows + pagination totals from common API response shapes:
 * { items, meta: { total, page, limit } }, { data: [], meta }, nested meta.pagination, or a plain array.
 */
export function parsePagedListResponse(res, defaults = { page: 1, limit: 10 }) {
  const root = res?.data ?? res;

  let list = [];
  let metaSource = {};

  if (Array.isArray(root)) {
    list = root;
  } else if (root && typeof root === "object") {
    if (Array.isArray(root.items)) {
      list = root.items;
      metaSource = root;
    } else if (Array.isArray(root.data)) {
      list = root.data;
      metaSource = root;
    } else if (Array.isArray(root.results)) {
      list = root.results;
      metaSource = root;
    } else {
      metaSource = root;
    }
  }

  const metaBlock =
    metaSource?.meta ??
    metaSource?.pagination ??
    res?.meta ??
    res?.pagination ??
    {};

  const pager =
    metaBlock?.pagination && typeof metaBlock.pagination === "object"
      ? metaBlock.pagination
      : metaBlock;

  const totalRaw = pager.total ?? pager.totalCount ?? pager.count ?? metaBlock.total;
  const totalNum = totalRaw != null && totalRaw !== "" ? Number(totalRaw) : NaN;
  const total = Number.isFinite(totalNum) && totalNum >= 0 ? totalNum : list.length;

  const page =
    Number(pager.page ?? pager.currentPage ?? defaults.page) || defaults.page;
  const limit =
    Number(pager.limit ?? pager.pageSize ?? pager.perPage ?? defaults.limit) ||
    defaults.limit;

  return { items: list, total, page, limit };
}
