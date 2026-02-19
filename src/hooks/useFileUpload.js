import { useState, useCallback } from "react";
import {
  uploadImageToS3,
  uploadAudioToS3,
  deleteFileFromS3,
} from "../services/upload/upload.service.js";
import {
  IMAGE_MIME_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_MAX_SIZE_LABEL,
  AUDIO_MIME_TYPES,
  AUDIO_MAX_SIZE_BYTES,
  AUDIO_MAX_SIZE_LABEL,
} from "../services/upload/upload.constants.js";

const getErrorMessage = (err) =>
  err.response?.data?.message ?? err.message ?? "Something went wrong";

/**
 * Validate image file type and size.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
function validateImage(file) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid image type. Allowed: JPEG, JPG, PNG, GIF, WebP. Got: ${file.type || "unknown"}.`,
    };
  }
  if (file.size > IMAGE_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image too large. Maximum size is ${IMAGE_MAX_SIZE_LABEL}.`,
    };
  }
  return { valid: true };
}

/**
 * Validate audio file type and size.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAudio(file) {
  if (!AUDIO_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid audio type. Allowed: MPEG, MP3, WAV, WebM, OGG, M4A. Got: ${file.type || "unknown"}.`,
    };
  }
  if (file.size > AUDIO_MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio too large. Maximum size is ${AUDIO_MAX_SIZE_LABEL}.`,
    };
  }
  return { valid: true };
}

/**
 * Reusable file upload hook with validation and S3 upload.
 * @returns {{
 *   uploadImage: (file: File, entityId: string) => Promise<{ fileUrl: string, key: string } | null>,
 *   uploadAudio: (file: File, entityId: string) => Promise<{ fileUrl: string, key: string } | null>,
 *   deleteFile: (fileUrl: string) => Promise<boolean>,
 *   loading: boolean,
 *   error: string | null,
 *   clearError: () => void
 * }}
 */
export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const uploadImage = useCallback(async (file, entityId) => {
    setError(null);
    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return null;
    }
    setLoading(true);
    try {
      const result = await uploadImageToS3(file, entityId);
      return result;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAudio = useCallback(async (file, entityId) => {
    setError(null);
    const validation = validateAudio(file);
    if (!validation.valid) {
      setError(validation.error);
      return null;
    }
    setLoading(true);
    try {
      const result = await uploadAudioToS3(file, entityId);
      return result;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileUrl) => {
    if (!fileUrl) return false;
    setError(null);
    setLoading(true);
    try {
      await deleteFileFromS3({ fileUrl });
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadImage,
    uploadAudio,
    deleteFile,
    loading,
    error,
    clearError,
  };
}
