import axios from "axios";
import {
  getImagePresignedUrl,
  getAudioPresignedUrl,
  deleteUploadedFile,
} from "./upload.api.js";

/**
 * Upload a file to S3 using presigned URL (no AWS SDK).
 * PUT request to uploadUrl with file body and Content-Type.
 * @param {string} uploadUrl - Presigned S3 URL
 * @param {File} file - File to upload
 */
async function putFileToS3(uploadUrl, file) {
  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
}

/**
 * Upload image to S3 via backend presigned URL.
 * @param {File} file - Image file
 * @param {string} entityId - Entity identifier (e.g. order id, user id)
 * @returns {Promise<{ fileUrl: string, key: string }>}
 */
export async function uploadImageToS3(file, entityId) {
  const payload = {
    fileName: file.name,
    contentType: file.type,
    entityId,
  };
  const { uploadUrl, fileUrl, key } = await getImagePresignedUrl(payload);
  await putFileToS3(uploadUrl, file);
  return { fileUrl, key };
}

/**
 * Upload audio to S3 via backend presigned URL.
 * @param {File} file - Audio file
 * @param {string} entityId - Entity identifier
 * @returns {Promise<{ fileUrl: string, key: string }>}
 */
export async function uploadAudioToS3(file, entityId) {
  const payload = {
    fileName: file.name,
    contentType: file.type,
    entityId,
  };
  const result = await getAudioPresignedUrl(payload);
  const { uploadUrl, fileUrl, key } = result?.data ?? result;
  if (!uploadUrl || !fileUrl) {
    throw new Error("Invalid presigned response: missing uploadUrl or fileUrl");
  }
  await putFileToS3(uploadUrl, file);
  return { fileUrl, key };
}

/**
 * Delete a file from S3 via backend (backend handles S3 delete).
 * @param {{ fileUrl: string }} params
 * @returns {Promise<unknown>}
 */
export async function deleteFileFromS3({ fileUrl }) {
  return deleteUploadedFile({ fileUrl });
}
