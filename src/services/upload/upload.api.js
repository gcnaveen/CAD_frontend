import axios from "axios";
import { API_BASE_URL } from "../../../config";

const UPLOAD_BASE = "/api/upload";

// Upload APIs are intentionally unauthenticated; use a client without auth interceptors.
const uploadClient = axios.create({
  baseURL: API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Get presigned URL for image upload.
 * POST /api/upload/image
 * @param {{ fileName: string, contentType: string, entityId: string }} payload
 * @returns {Promise<{ uploadUrl: string, fileUrl: string, key: string }>}
 */
export async function getImagePresignedUrl(payload) {
  const { data } = await uploadClient.post(`${UPLOAD_BASE}/image`, payload);
  return data?.data ?? data;
}

/**
 * Get presigned URL for audio upload.
 * POST /api/upload/audio
 * @param {{ fileName: string, contentType: string, entityId: string }} payload
 * @returns {Promise<{ uploadUrl: string, fileUrl: string, key: string }>}
 */
export async function getAudioPresignedUrl(payload) {
  const { data } = await uploadClient.post(`${UPLOAD_BASE}/audio`, payload);
  return data?.data ?? data;
}

/**
 * Delete an uploaded file from S3 (backend invalidates/removes by fileUrl or key).
 * POST /api/upload/delete
 * @param {{ fileUrl: string }} payload
 * @returns {Promise<unknown>}
 */
export async function deleteUploadedFile(payload) {
  const { data } = await uploadClient.post(`${UPLOAD_BASE}/delete`, payload);
  return data;
}
