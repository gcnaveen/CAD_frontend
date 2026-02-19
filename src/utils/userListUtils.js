/**
 * Parse GET /users API response: { success, data: { items, meta } }
 * and map each user to a flat row for tables.
 */
export function parseUsersResponse(res) {
  const data = res?.data ?? res;
  const items = data?.items ?? (Array.isArray(data) ? data : []);
  const meta = data?.meta ?? null;
  return { items: Array.isArray(items) ? items : [], meta };
}

/**
 * Map API user shape to table row (name.first/last, auth.phone/email, _id).
 */
export function mapUserToRow(user) {
  const first = user.name?.first ?? "";
  const last = user.name?.last ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || "-";
  return {
    ...user,
    id: user.id ?? user._id,
    _id: user._id,
    name,
    email: user.auth?.email ?? "-",
    mobile: user.auth?.phone ?? "-",
  };
}

/**
 * For CAD users: also map to cadCenterName and authoritativePersonName.
 */
export function mapCadUserToRow(user) {
  const row = mapUserToRow(user);
  const authName = row.name;
  const cadName = user.cadProfile?.name ?? user.cadProfile?.centerName ?? user.cadCenterName ?? authName;
  return {
    ...row,
    cadCenterName: cadName || "-",
    authoritativePersonName: authName || "-",
  };
}
