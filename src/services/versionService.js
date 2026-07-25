import apiClient from "./apiClient.js";

/**
 * GET /api/version — release provenance (H-05).
 * Public/ops metadata; safe for existing clients to ignore.
 *
 * @returns {Promise<{
 *   gitSha?: string,
 *   lockHash?: string,
 *   stage?: string,
 *   migrationVersion?: string | number,
 *   deployedAt?: string,
 * } | null>}
 */
export async function fetchReleaseVersion() {
  try {
    const { data } = await apiClient.get("/api/version");
    return data?.data ?? data ?? null;
  } catch {
    // Optional UI only — never break dashboards if the endpoint is missing.
    return null;
  }
}
