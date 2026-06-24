import apiClient from "../apiClient.js";

const BASE = "/api/admin/survey-draft-reports";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/**
 * List survey sketch drafts (Admin / Super Admin).
 * GET /api/admin/survey-draft-reports?page=1&limit=20&surveyorId=optional
 * @param {{ page?: number, limit?: number, surveyorId?: string }} params
 * @returns {Promise<{ success?: boolean, data?: any[], meta?: any }>}
 */
export async function getSurveyDraftReports(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to load survey draft reports");
  }
}
