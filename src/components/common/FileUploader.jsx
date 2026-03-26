import React, { useState, useRef } from "react";
import { useFileUpload } from "../../hooks/useFileUpload.js";
import { IMAGE_MAX_SIZE_LABEL, AUDIO_MAX_SIZE_LABEL } from "../../services/upload/upload.constants.js";
import { X, ImageIcon, Music } from "lucide-react";

/**
 * Example reusable file uploader: image + audio, preview, loader, delete.
 * @param {{ entityId: string }} props - entityId for upload (e.g. order id, user id)
 */
export default function FileUploader({ entityId = "example-entity" }) {
  const {
    uploadImage,
    uploadAudio,
    deleteFile,
    loading,
    error,
    clearError,
  } = useFileUpload();

  const [imageResult, setImageResult] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearError();
    const result = await uploadImage(file, entityId);
    if (result) setImageResult(result);
    e.target.value = "";
  };

  const handleAudioChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearError();
    const result = await uploadAudio(file, entityId);
    if (result) setAudioResult(result);
    e.target.value = "";
  };

  const handleRemoveImage = async () => {
    if (!imageResult?.fileUrl) return;
    const ok = await deleteFile(imageResult.fileUrl);
    if (ok) setImageResult(null);
  };

  const handleRemoveAudio = async () => {
    if (!audioResult?.fileUrl) return;
    const ok = await deleteFile(audioResult.fileUrl);
    if (ok) setAudioResult(null);
  };

  return (
    <div className="theme-animate-surface space-y-6 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <h3 className="text-base font-semibold text-fg">File upload (example)</h3>

      {error && (
        <div
          className="flex items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] px-3 py-2 text-sm text-danger"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-danger hover:opacity-80"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Image upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-fg">Image (max {IMAGE_MAX_SIZE_LABEL})</label>
        <div className="flex flex-wrap items-start gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            disabled={loading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-fg shadow-sm transition hover:bg-surface-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-fg-muted" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
            {imageResult ? "Change image" : "Choose image"}
          </button>
          {imageResult && (
            <div className="relative inline-block">
              <img
                src={imageResult.fileUrl}
                alt="Upload preview"
                className="h-20 w-20 rounded-lg border border-line object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={loading}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow hover:opacity-90 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Audio upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-fg">Audio (max {AUDIO_MAX_SIZE_LABEL})</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/webm,audio/ogg,audio/mp4,audio/x-m4a"
            onChange={handleAudioChange}
            disabled={loading}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-fg shadow-sm transition hover:bg-surface-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-fg-muted" />
            ) : (
              <Music className="h-4 w-4" />
            )}
            {audioResult ? "Change audio" : "Choose audio"}
          </button>
          {audioResult && (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2">
              <Music className="h-4 w-4 text-fg-muted" />
              <span className="truncate text-sm text-fg" title={audioResult.fileUrl}>
                {audioResult.fileUrl.split("/").pop() || "Audio file"}
              </span>
              <button
                type="button"
                onClick={handleRemoveAudio}
                disabled={loading}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-danger hover:bg-[color-mix(in_srgb,var(--danger)_12%,var(--bg-secondary))] disabled:opacity-50"
                aria-label="Remove audio"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
