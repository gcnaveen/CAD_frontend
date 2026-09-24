// src/dashboard/user/form/steps/DrawingStep.jsx
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Form, Input, Upload, message, Typography } from "antd";

const { Text } = Typography;
import { Mic, Square, Trash2, Upload as UploadIcon } from "lucide-react";
import {
  uploadAudioToS3,
  toVoiceNoteFile,
  pickVoiceRecorderMimeType,
  buildVoiceNoteBlob,
} from "../../../../services/upload/upload.service.js";
import { getUploadErrorMessage } from "../../../../services/upload/upload.errors.js";
import { deleteUploadedFile } from "../../../../services/upload/upload.api.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../../services/upload/upload.constants.js";
import {
  createLocalPreviewUrl,
  revokeLocalPreviewUrl,
} from "../../../../utils/localFilePreview.js";
import { resolvePlayableMediaUrl } from "../../../../utils/draftAudio.js";

const { TextArea } = Input;
const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg,.webm";

const SectionHeader = ({ icon, titleKn, titleEn }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-9 h-9 rounded-2xl bg-(--user-accent-soft) border border-[color-mix(in_srgb,var(--user-accent)_22%,var(--border-color))] flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-(--user-accent) uppercase tracking-widest leading-none mb-0.5">{titleKn}</p>
      <p className="text-lg font-extrabold text-fg leading-none">{titleEn}</p>
    </div>
  </div>
);

const FieldLabel = ({ kn, en, required, optional }) => (
  <span className="flex flex-col leading-none mb-1">
    <span className="text-[10px] font-semibold text-fg-muted">{kn}</span>
    <span className="text-sm font-bold text-fg">
      {en}
      {required && <span className="text-(--user-accent) ml-0.5">*</span>}
      {optional && <span className="text-fg-muted font-semibold ml-1 text-xs">(optional)</span>}
    </span>
  </span>
);

const audioRemoteUrl = (audio) => audio?.fileUrl || audio?.url || null;
const STOP_RECORDING_TIMEOUT_MS = 5000;
const UPLOAD_IDLE_TIMEOUT_MS = 30000;

const waitWhile = (predicate, timeoutMs) =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (!predicate() || Date.now() - start >= timeoutMs) {
        resolve();
        return;
      }
      setTimeout(tick, 40);
    };
    tick();
  });

const DrawingStep = forwardRef(({ form, onAudioChange, audioData, onUploadingChange, superimposeAddOnRupees = 0 }, ref) => {
  const audioField = Form.useWatch("audio", form);
  /** Parent `audioData` survives step unmount; form field may clear when this step is not mounted. */
  const savedAudio = audioRemoteUrl(audioField) ? audioField : audioRemoteUrl(audioData) ? audioData : null;
  const playSrc = resolvePlayableMediaUrl(savedAudio) || null;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadingAudio, setUpAudio] = useState(false);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  /** Object URLs owned by this step before they are handed off to saved audio meta. */
  const pendingPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const isRecordingRef = useRef(false);
  const audioBlobRef = useRef(null);
  const audioUrlRef = useRef(null);
  const uploadingAudioRef = useRef(false);
  const flushInFlightRef = useRef(false);
  const stopWaitersRef = useRef([]);
  const formRef = useRef(form);
  const onAudioChangeRef = useRef(onAudioChange);
  formRef.current = form;
  onAudioChangeRef.current = onAudioChange;

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const clearRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resolveStopWaiters = (blob) => {
    const waiters = stopWaitersRef.current;
    stopWaitersRef.current = [];
    waiters.forEach((resolve) => resolve(blob));
  };

  const markRecordingStopped = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    clearRecordingTimer();
  };

  useEffect(() => {
    uploadingAudioRef.current = uploadingAudio;
    onUploadingChange?.(uploadingAudio);
    return () => onUploadingChange?.(false);
  }, [uploadingAudio, onUploadingChange]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        message.error("Microphone is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickVoiceRecorderMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = buildVoiceNoteBlob(chunks, recorder, mime);
        const localUrl = createLocalPreviewUrl(blob);
        audioBlobRef.current = blob;
        audioUrlRef.current = localUrl;
        pendingPreviewRef.current = localUrl;
        setAudioBlob(blob);
        setAudioUrl(localUrl);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        resolveStopWaiters(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecTime(0);
      timerRef.current = setInterval(() => setRecTime((p) => p + 1), 1000);
    } catch (err) {
      const blocked = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      message.error(
        blocked
          ? "Microphone blocked. Allow mic for this site, then hard-refresh (Ctrl+Shift+R)."
          : "Failed to access microphone. Check permissions."
      );
    }
  };

  const stopRecorderAndWait = () =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        markRecordingStopped();
        resolve(audioBlobRef.current);
        return;
      }
      const timeout = setTimeout(() => {
        resolve(audioBlobRef.current);
      }, STOP_RECORDING_TIMEOUT_MS);
      const onStopped = (blob) => {
        clearTimeout(timeout);
        resolve(blob);
      };
      stopWaitersRef.current.push(onStopped);
      try {
        if (recorder.state === "recording" || recorder.state === "paused") {
          if (typeof recorder.requestData === "function") {
            try {
              recorder.requestData();
            } catch {
              /* some browsers throw if a data request is already in flight */
            }
          }
          recorder.stop();
        }
      } catch {
        clearTimeout(timeout);
        stopWaitersRef.current = stopWaitersRef.current.filter((w) => w !== onStopped);
        resolve(audioBlobRef.current);
        return;
      }
      markRecordingStopped();
    });

  const stopRecording = () => {
    if (!isRecordingRef.current && mediaRecorderRef.current?.state === "inactive") return;
    void stopRecorderAndWait();
  };

  const uploadRecordedBlob = async (blob) => {
    const source = blob || audioBlobRef.current;
    if (!source?.size) return true;
    const villageId = formRef.current?.getFieldValue("village");
    if (!villageId) {
      message.warning("Please select village first");
      return false;
    }
    setUpAudio(true);
    uploadingAudioRef.current = true;
    try {
      const file = await toVoiceNoteFile(source);
      const { fileUrl, key } = await uploadAudioToS3(file, villageId);
      // Keep local blob URL so playback works while S3 objects remain private (H-10).
      const previewUrl = audioUrlRef.current || createLocalPreviewUrl(file);
      pendingPreviewRef.current = null;
      const val = {
        fileUrl,
        key,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        previewUrl: previewUrl || undefined,
      };
      formRef.current?.setFieldsValue({ audio: val });
      onAudioChangeRef.current?.(val);
      message.success("Audio uploaded");
      audioBlobRef.current = null;
      audioUrlRef.current = null;
      setAudioBlob(null);
      setAudioUrl(null);
      return true;
    } catch (e) {
      message.error(getUploadErrorMessage(e) || "Failed to upload audio");
      return false;
    } finally {
      uploadingAudioRef.current = false;
      setUpAudio(false);
    }
  };

  const handleUploadRecorded = async () => {
    await uploadRecordedBlob(audioBlobRef.current);
  };

  useImperativeHandle(ref, () => ({
    flushPendingAudio: async () => {
      if (flushInFlightRef.current) return false;
      flushInFlightRef.current = true;
      try {
        if (uploadingAudioRef.current) {
          await waitWhile(() => uploadingAudioRef.current, UPLOAD_IDLE_TIMEOUT_MS);
          if (uploadingAudioRef.current) return false;
          if (!audioBlobRef.current?.size) return true;
        }
        const wasRecording =
          isRecordingRef.current || mediaRecorderRef.current?.state === "recording";
        if (wasRecording) {
          await stopRecorderAndWait();
          if (!audioBlobRef.current?.size) {
            message.warning("Could not finish the recording. Please stop and try again.");
            return false;
          }
        }
        const pending = audioBlobRef.current;
        if (!pending?.size) return true;
        return await uploadRecordedBlob(pending);
      } finally {
        flushInFlightRef.current = false;
      }
    },
  }));

  const handleAudioFile = async (file) => {
    const villageId = form.getFieldValue("village");
    if (!villageId) {
      message.warning("Please select village first");
      return false;
    }
    if (file.size > AUDIO_MAX_SIZE_BYTES) {
      message.error(`Max ${AUDIO_MAX_SIZE_BYTES / 1024 / 1024}MB`);
      return false;
    }
    setUpAudio(true);
    uploadingAudioRef.current = true;
    try {
      const actual =
        file instanceof File
          ? file
          : file.originFileObj instanceof File
            ? file.originFileObj
            : file;
      const localPreview = createLocalPreviewUrl(actual);
      const { fileUrl, key } = await uploadAudioToS3(actual, villageId);
      const val = {
        fileUrl,
        key,
        fileName: actual.name,
        mimeType: actual.type,
        size: actual.size,
        previewUrl: localPreview || undefined,
      };
      form.setFieldsValue({ audio: val });
      onAudioChange?.(val);
      message.success("Audio uploaded");
    } catch (e) {
      message.error(getUploadErrorMessage(e) || "Failed to upload audio");
    } finally {
      uploadingAudioRef.current = false;
      setUpAudio(false);
    }
    return false;
  };

  const handleDeleteAudio = async () => {
    const d = form.getFieldValue("audio") || audioData;
    if (d?.fileUrl || d?.key) {
      try {
        await deleteUploadedFile(d.fileUrl ? { fileUrl: d.fileUrl } : { key: d.key });
      } catch {
        /* silent */
      }
    }
    revokeLocalPreviewUrl(d?.previewUrl);
    revokeLocalPreviewUrl(audioUrlRef.current);
    revokeLocalPreviewUrl(pendingPreviewRef.current);
    pendingPreviewRef.current = null;
    audioBlobRef.current = null;
    audioUrlRef.current = null;
    setAudioBlob(null);
    setAudioUrl(null);
    setRecTime(0);
    form.setFieldsValue({ audio: null });
    onAudioChange?.(null);
  };

  useEffect(() => {
    if (!audioRemoteUrl(audioData)) return;
    if (audioRemoteUrl(audioField)) return;
    form.setFieldsValue({ audio: audioData });
  }, [audioData, audioField, form]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      // Only revoke pending (pre-upload) previews — saved previewUrl is owned by parent audioData.
      revokeLocalPreviewUrl(pendingPreviewRef.current);
      pendingPreviewRef.current = null;
    },
    []
  );

  const googleSuperimpose = Form.useWatch("googleSuperimpose", form);

  return (
    <div className="relative">
      {uploadingAudio && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[color-mix(in_srgb,var(--bg-primary)_72%,transparent)] backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <div className="w-8 h-8 rounded-full border-2 border-(--user-accent) border-t-transparent animate-spin" />
          <p className="text-sm font-extrabold text-fg">Uploading audio…</p>
          <p className="text-xs font-semibold text-fg-muted">Please wait — do not continue yet</p>
        </div>
      )}

      <SectionHeader
        titleKn="ನಕ್ಷೆ ವಿವರ"
        titleEn="Drawing Details"
        icon={
          <svg className="w-5 h-5 text-(--user-accent)" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />

      <div className="space-y-5">
        <button
          type="button"
          onClick={() => form.setFieldValue("googleSuperimpose", !googleSuperimpose)}
          disabled={uploadingAudio}
          className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
            googleSuperimpose
              ? "border-[color-mix(in_srgb,var(--user-accent)_55%,var(--border-color))] bg-(--user-accent-soft)"
              : "border-line bg-surface hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))]"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              googleSuperimpose ? "border-(--user-accent) bg-(--user-accent)" : "border-line bg-surface"
            }`}
          >
            {googleSuperimpose && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-extrabold text-sm text-fg">Google Superimpose</p>
            <p className="text-xs text-fg-muted font-semibold mt-0.5">ಗೂಗಲ್ ಉಪಗ್ರಹ ಮೇಲ್ದರ / Satellite overlay on drawing</p>
          </div>
        </button>
        <Text type="secondary" className="block text-xs leading-snug -mt-1 mb-0.5">
          Selecting Google Superimpose will add ₹{Number(superimposeAddOnRupees) || 0} to your total cost.
        </Text>

        <Form.Item name="others" label={<FieldLabel kn="ಟಿಪ್ಪಣಿಗಳು" en="Notes" optional />}>
          <TextArea
            rows={3}
            placeholder="Type your instructions or record a voice note"
            size="large"
            className="w-full resize-none rounded-xl"
            disabled={uploadingAudio}
          />
        </Form.Item>

        <Form.Item name="audio" noStyle>
          <div className="hidden" />
        </Form.Item>

        <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
          <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mb-0.5">ಆಡಿಯೋ</p>
          <p className="text-sm font-extrabold text-fg mb-3">
            Voice Note <span className="text-fg-muted font-semibold text-xs">(optional)</span>
          </p>

          {!isRecording && !audioBlob && !savedAudio && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={startRecording}
                disabled={uploadingAudio}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-(--user-accent) hover:bg-(--user-accent-hover) text-white font-extrabold text-sm transition-colors disabled:opacity-60"
              >
                <Mic className="w-4 h-4" /> Record Audio
              </button>
              <Upload accept={AUDIO_ACCEPT} showUploadList={false} beforeUpload={handleAudioFile} disabled={uploadingAudio}>
                <button
                  type="button"
                  disabled={uploadingAudio}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-line bg-surface hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] text-fg font-extrabold text-sm transition-colors disabled:opacity-60"
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploadingAudio ? "Uploading…" : "Upload File"}
                </button>
              </Upload>
            </div>
          )}

          {isRecording && (
            <div className="flex items-center justify-between rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--danger)_25%,var(--border-color))] p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-danger flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-surface animate-pulse" />
                </div>
                <div>
                  <p className="font-extrabold text-danger text-sm">Recording…</p>
                  <p className="text-xs text-danger font-bold">{fmt(recordingTime)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger text-white font-extrabold text-sm"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          )}

          {audioBlob && audioUrl && !savedAudio && (
            <div className="space-y-3">
              <audio controls src={audioUrl} className="w-full rounded-xl" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadRecorded}
                  disabled={uploadingAudio}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-(--user-accent) hover:bg-(--user-accent-hover) text-white font-extrabold text-sm disabled:opacity-60 transition-colors"
                >
                  <UploadIcon className="w-4 h-4" />
                  {uploadingAudio ? "Uploading…" : "Save Recording"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  disabled={uploadingAudio}
                  className="px-4 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger font-extrabold text-sm hover:opacity-90 transition-colors disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {savedAudio && (
            <div className="rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--success)_35%,var(--border-color))] p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-extrabold text-success text-sm">✓ Audio saved</p>
                  <p className="text-xs text-success font-semibold truncate">{savedAudio.fileName || "Audio file"}</p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAudio}
                  disabled={uploadingAudio}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-surface text-danger font-bold text-xs hover:bg-surface-2 transition-colors disabled:opacity-60"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
              {playSrc ? (
                <audio controls src={playSrc} className="w-full rounded-lg" preload="metadata" />
              ) : (
                <p className="text-xs font-semibold text-fg-muted">
                  Audio is saved. Preview will work once a signed listen URL is available.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

DrawingStep.displayName = "DrawingStep";

export default DrawingStep;
