import apiClient from "../apiClient.js";

const BASE = "/api/surveyor/sketch-uploads";

function handleError(error, fallbackMessage) {
  const message = error.response?.data?.message ?? error.message ?? fallbackMessage;
  throw new Error(message);
}

/**
 * Create Surveyor Sketch Upload
 * POST /api/surveyor/sketch-uploads
 * @param {{
 *   surveyType: "joint_flat" | "single_flat",
 *   district: string, // ObjectId
 *   taluka: string, // ObjectId
 *   hobli: string, // ObjectId
 *   village: string, // ObjectId
 *   surveyNo: string,
 *   moolaTippani?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   hissaTippani?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   atlas?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   rrPakkabook?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   kharabu?: string | { url: string, fileName?: string, mimeType?: string, size?: number },
 *   audio?: { url: string, fileUrl: string, fileName?: string, mimeType?: string, size?: number },
 *   others?: string
 * }} payload
 * @returns {Promise<{ success: boolean, data: any }>}
 */
export async function createSketchUpload(payload) {
  try {
    const { data } = await apiClient.post(BASE, payload);
    return data;
  } catch (error) {
    handleError(error, "Failed to create sketch upload");
  }
}

/**
 * Get Sketch Upload by ID
 * GET /api/surveyor/sketch-uploads/{id}
 */
export async function getSketchUploadById(id) {
  try {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch sketch upload");
  }
}

/**
 * List Sketch Uploads (with query params: page, limit, status, etc.)
 * GET /api/surveyor/sketch-uploads
 */
export async function getSketchUploads(params = {}) {
  try {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch sketch uploads");
  }
}

/**
 * List surveyor orders with bucket counts
 * GET /api/surveyor/orders
 * @param {{
 *  bucket?: "all" | "active" | "completed" | "cancelled",
 *  page?: number,
 *  limit?: number
 * }} params
 * @returns {Promise<{ success: boolean, data: any[], meta: any }>}
 */
export async function getSurveyorOrders(params = {}) {
  try {
    const { data } = await apiClient.get("/api/surveyor/orders", { params });
    return data;
  } catch (error) {
    handleError(error, "Failed to fetch surveyor orders");
  }
}
