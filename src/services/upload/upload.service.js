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
  // Use fetch so the browser behavior matches our other uploads (Documentsstep.jsx).
  // This also gives clearer status errors when S3 rejects the PUT.
  const headers = {};
  if (file?.type) headers["Content-Type"] = file.type;

  const redactedUploadUrl = typeof uploadUrl === "string" ? uploadUrl.split("?")[0] : uploadUrl;

  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers,
    });

    if (!res.ok) {
      let details = "";
      try {
        details = await res.text();
      } catch {
        // ignore
      }

      // Temporary: helps backend verify why presigned PUT fails.
      console.error("s3 backend log", {
        uploadUrl: redactedUploadUrl,
        fileName: file?.name,
        contentType: file?.type,
        status: res.status,
        statusText: res.statusText,
        responseBody: typeof details === "string" ? details : "",
      });

      const trimmed = typeof details === "string" ? details.slice(0, 300) : "";
      throw new Error(`S3 PUT failed (${res.status} ${res.statusText}) ${trimmed}`.trim());
    }
  } catch (err) {
    console.error("s3 backend log", {
      uploadUrl: redactedUploadUrl,
      fileName: file?.name,
      contentType: file?.type,
      error: err?.message || String(err),
    });
    throw err;
  }
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
