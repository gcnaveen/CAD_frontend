import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ExternalLink, Mic, Music, Square, Trash2, Upload as UploadIcon } from "lucide-react";
import { uploadAudioToS3 } from "../../../services/upload/upload.service.js";
import {
  getSketchUploadById,
  requestCadRevision,
} from "../../../services/surveyor/sketchUploadService.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../services/upload/upload.constants.js";

const { Text } = Typography;
const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg";

const STATUS_DISPLAY = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  CAD_DELIVERED: "CAD Delivered",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STATUS_COLORS = {
  PENDING: "warning",
  ASSIGNED: "processing",
  CAD_DELIVERED: "cyan",
  UNDER_REVIEW: "processing",
  APPROVED: "success",
  REJECTED: "error",
};

const SINGLE_MODE_DOCUMENT_LABELS = {
  is_originaltippani: "Moola Tippani",
  is_hissatippani: "Hissa Tippani",
  is_atlas: "Atlas",
  is_rrpakkabook: "RR Pakkabook",
  is_akarabandu: "Akarabandu",
  is_kharabuttar: "Kharab Utthar",
  is_mulapatra: "Moola Patra",
};

const DOCUMENT_LABELS = {
  moolaTippani: "Moola Tippani",
  hissaTippani: "Hissa Tippani",
  atlas: "Atlas",
  rrPakkabook: "RR Pakkabook",
  kharabu: "Kharabu",
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(2)} ${sizes[index]}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return String(value);
  }
};

const toName = (value) => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value?.name || value?.label || value?.code || "-";
};

const SurveyOrderDetailDrawer = ({ open, uploadId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [revisionRemarks, setRevisionRemarks] = useState("");
  const [revisionAudio, setRevisionAudio] = useState(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [submittingRevision, setSubmittingRevision] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      if (!open || !uploadId) return;
      setLoading(true);
      setDetails(null);
      try {
        const res = await getSketchUploadById(uploadId);
        if (res?.success && res?.data) {
          setDetails(res.data);
          setRevisionRemarks("");
          setRevisionAudio(null);
          setAudioBlob(null);
          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
          }
        } else {
          message.error("Unable to load order details");
        }
      } catch (error) {
        message.error(error?.message || "Unable to load order details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, uploadId]);

  const selectedSingleDocTypes = useMemo(() => {
    if (!details) return [];
    return Object.keys(SINGLE_MODE_DOCUMENT_LABELS)
      .filter((key) => details[key] === true)
      .map((key) => SINGLE_MODE_DOCUMENT_LABELS[key]);
  }, [details]);

  const canRequestRevision = details?.status === "CAD_DELIVERED";
  const revisionCount = Array.isArray(details?.revisionRequests)
    ? details.revisionRequests.length
    : 0;

  const handleAudioUpload = async (file) => {
    if (!file || !uploadId) return false;
    if (file.size > AUDIO_MAX_SIZE_BYTES) {
      message.error(`Max ${AUDIO_MAX_SIZE_BYTES / 1024 / 1024}MB`);
      return false;
    }
    setAudioUploading(true);
    try {
      const result = await uploadAudioToS3(file, String(uploadId));
      setRevisionAudio({
        url: result?.fileUrl,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });
      message.success("Audio uploaded");
    } catch (error) {
      message.error(error?.message || "Audio upload failed");
    } finally {
      setAudioUploading(false);
    }
    return false;
  };

  const formatTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const clearAudioSelection = () => {
    setRevisionAudio(null);
    setAudioBlob(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mimeType || undefined });
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch {
      message.error("Failed to access microphone. Check permissions.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return;
    mediaRecorder.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadRecordedAudio = async () => {
    if (!audioBlob) return;
    const file = new File([audioBlob], `audio-${Date.now()}.webm`, {
      type: audioBlob.type || "audio/webm",
    });
    await handleAudioUpload(file);
  };

  const handleRequestRevision = async () => {
    if (!uploadId || submittingRevision || !canRequestRevision) return;
    const remarks = String(revisionRemarks || "").trim();
    if (!remarks && !revisionAudio?.url) {
      message.warning("Add remarks or upload audio to request revision");
      return;
    }

    setSubmittingRevision(true);
    try {
      const payload = {};
      if (remarks) payload.remarks = remarks;
      if (revisionAudio?.url) payload.audio = revisionAudio;

      const revisionRes = await requestCadRevision(uploadId, payload);
      const payment = revisionRes?.meta?.payment;
      const paymentRedirectUrl =
        typeof payment?.redirectUrl === "string" ? payment.redirectUrl.trim() : "";

      // Redirect only when redirectUrl is present (non-empty trimmed string).
      if (paymentRedirectUrl) {
        try {
          localStorage.setItem(
            "cad:lastPayment",
            JSON.stringify({
              uploadId,
              merchantOrderId: payment?.merchantOrderId ?? null,
              amountPaise: payment?.amountPaise ?? null,
              revisionNo: payment?.revisionNo ?? null,
              startedAt: new Date().toISOString(),
              redirectUrl: paymentRedirectUrl,
            })
          );
        } catch {
          // ignore storage failures; redirect should still happen
        }

        message.success("Redirecting to payment...");
        window.location.assign(paymentRedirectUrl);
        return;
      }

      message.success("Revision request submitted");

      const res = await getSketchUploadById(uploadId);
      if (res?.success && res?.data) {
        setDetails(res.data);
      }
      setRevisionRemarks("");
      setRevisionAudio(null);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to request revision";
      message.error(msg);
    } finally {
      setSubmittingRevision(false);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl]
  );

  return (
    <Drawer
      title={details?.applicationId || "Order Details"}
      placement="right"
      width="min(100vw, 620px)"
      open={open}
      onClose={onClose}
      destroyOnClose
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spin size="large" />
        </div>
      ) : !details ? (
        <div className="py-12 text-center">
          <Text type="secondary">No details available.</Text>
        </div>
      ) : (
        <div className="space-y-4">
          <Descriptions bordered size="small" column={1} title="Order Information">
            <Descriptions.Item label="Application ID">{details.applicationId || "-"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLORS[details.status] || "default"}>
                {STATUS_DISPLAY[details.status] || details.status || "-"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status Note">{details.statusNote || "-"}</Descriptions.Item>
            <Descriptions.Item label="Survey Type">{details.surveyType || "-"}</Descriptions.Item>
            <Descriptions.Item label="Survey No">{details.surveyNo || "-"}</Descriptions.Item>
            <Descriptions.Item label="District">{toName(details.district)}</Descriptions.Item>
            <Descriptions.Item label="Taluka">{toName(details.taluka)}</Descriptions.Item>
            <Descriptions.Item label="Hobli">{toName(details.hobli)}</Descriptions.Item>
            <Descriptions.Item label="Village">{toName(details.village)}</Descriptions.Item>
            <Descriptions.Item label="Created At">{formatDate(details.createdAt)}</Descriptions.Item>
            <Descriptions.Item label="Updated At">{formatDate(details.updatedAt)}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title="Documents">
            {(details.uploadMode === "single" || details.singleUpload) ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">{details.singleUpload?.fileName || "Single Upload"}</p>
                <p className="text-xs text-fg-muted">
                  {details.singleUpload?.mimeType || "Unknown"} - {formatFileSize(details.singleUpload?.size)}
                </p>
                <p className="text-xs text-fg-muted">
                  Types: {selectedSingleDocTypes.length > 0 ? selectedSingleDocTypes.join(", ") : "-"}
                </p>
                {details.singleUpload?.url && (
                  <Button type="link" icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(details.singleUpload.url, "_blank")}>
                    Open file
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.keys(DOCUMENT_LABELS).map((key) => {
                  const doc = details.documents?.[key];
                  return (
                    <div key={key} className="rounded-lg border border-line p-2">
                      <p className="text-sm font-semibold">{DOCUMENT_LABELS[key]}</p>
                      {doc?.url ? (
                        <>
                          <p className="text-xs text-fg-muted">{doc.fileName || "Document"}</p>
                          <Button type="link" icon={<ExternalLink className="h-4 w-4" />} onClick={() => window.open(doc.url, "_blank")}>
                            Open file
                          </Button>
                        </>
                      ) : (
                        <p className="text-xs text-fg-muted">Not uploaded</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card size="small" title="Audio">
            {details.audio?.url ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <Text>{details.audio.fileName || "Audio file"}</Text>
                </div>
                <audio controls src={details.audio.url} className="w-full" preload="metadata">
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : (
              <Text type="secondary">No audio uploaded.</Text>
            )}
          </Card>

          {details.cadDeliverable?.url && (
            <Card size="small" title="CAD Deliverable">
              <div className="space-y-2">
                <p className="text-sm font-semibold">{details.cadDeliverable.fileName || "CAD Deliverable"}</p>
                <p className="text-xs text-fg-muted">
                  {details.cadDeliverable.mimeType || "Unknown"} - {formatFileSize(details.cadDeliverable.size)}
                </p>
                <p className="text-xs text-fg-muted">
                  Uploaded: {formatDate(details.cadDeliverable.uploadedAt)}
                </p>
                <Button
                  type="link"
                  icon={<ExternalLink className="h-4 w-4" />}
                  onClick={() => window.open(details.cadDeliverable.url, "_blank")}
                >
                  Open CAD Deliverable
                </Button>
              </div>
            </Card>
          )}

          {canRequestRevision && (
            <Card size="small" title="Request Revision">
              <div className="space-y-3">
                <p className="text-xs text-fg-muted">
                  Revisions requested: <span className="font-semibold text-fg">{revisionCount}</span>
                </p>
                <p className="text-xs text-fg-muted">
                  Currently you can request revision multiple times. After payment integration, only one free revision will be available and further revisions may be charged.
                </p>
                <Input.TextArea
                  rows={3}
                  placeholder="Add remarks for CAD revision"
                  value={revisionRemarks}
                  onChange={(e) => setRevisionRemarks(e.target.value)}
                  maxLength={1000}
                />
                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mb-0.5">
                    ಆಡಿಯೋ
                  </p>
                  <p className="text-sm font-extrabold text-fg mb-3">
                    Voice Note <span className="text-fg-muted font-semibold text-xs">(optional)</span>
                  </p>

                  {!isRecording && !audioBlob && !revisionAudio && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] text-white font-extrabold text-sm transition-colors"
                      >
                        <Mic className="w-4 h-4" /> Record Audio
                      </button>
                      <Upload
                        accept={AUDIO_ACCEPT}
                        showUploadList={false}
                        beforeUpload={handleAudioUpload}
                        disabled={audioUploading}
                      >
                        <button
                          type="button"
                          disabled={audioUploading}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-line bg-surface hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] text-fg font-extrabold text-sm transition-colors"
                        >
                          <UploadIcon className="w-4 h-4" />
                          {audioUploading ? "Uploading..." : "Upload File"}
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
                          <p className="font-extrabold text-danger text-sm">Recording...</p>
                          <p className="text-xs text-danger font-bold">{formatTime(recordingTime)}</p>
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

                  {audioBlob && audioUrl && !revisionAudio && (
                    <div className="space-y-3">
                      <audio controls src={audioUrl} className="w-full rounded-xl" />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={uploadRecordedAudio}
                          disabled={audioUploading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] text-white font-extrabold text-sm disabled:opacity-60 transition-colors"
                        >
                          <UploadIcon className="w-4 h-4" />
                          {audioUploading ? "Uploading..." : "Save Recording"}
                        </button>
                        <button
                          type="button"
                          onClick={clearAudioSelection}
                          disabled={audioUploading}
                          className="px-4 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger font-extrabold text-sm hover:opacity-90 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {revisionAudio && (
                    <div className="rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--success)_35%,var(--border-color))] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-extrabold text-success text-sm">✓ Audio saved</p>
                          <p className="text-xs text-success font-semibold truncate">
                            {revisionAudio.fileName || "Audio attached"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearAudioSelection}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-surface text-danger font-bold text-xs hover:bg-surface-2 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                      {revisionAudio.url && (
                        <audio controls src={revisionAudio.url} className="w-full rounded-lg" />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="primary"
                  onClick={handleRequestRevision}
                  loading={submittingRevision}
                  disabled={audioUploading || submittingRevision}
                >
                  Submit Revision Request
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </Drawer>
  );
};

export default SurveyOrderDetailDrawer;
