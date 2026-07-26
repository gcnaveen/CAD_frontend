import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Rate,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  Alert,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Mic, Music, Square, Trash2, Upload as UploadIcon } from "lucide-react";
import {
  uploadAudioToS3,
  toVoiceNoteFile,
} from "../../../services/upload/upload.service.js";
import { getUploadErrorMessage } from "../../../services/upload/upload.errors.js";
import {
  getSketchUploadById,
  requestCadRevision,
  initiateBalancePayment,
  getCadDownload,
} from "../../../services/surveyor/sketchUploadService.js";
import {
  getAssignmentFeedback,
  submitAssignmentFeedback,
  lookupAssignmentIdForSketch,
  resolveAssignedCadUserIdFromEntity,
  resolveAssignmentIdFromEntity,
} from "../../../services/assignmentApi.js";
import { AUDIO_MAX_SIZE_BYTES } from "../../../services/upload/upload.constants.js";
import FileViewDownloadButtons from "../../../components/files/FileViewDownloadButtons.jsx";
import RevisionRequestsCard from "../../../components/orders/RevisionRequestsCard.jsx";
import SketchPaymentRetryButton from "../../../components/payments/SketchPaymentRetryButton.jsx";
import {
  canRetrySketchPayment,
  formatSketchPayableRupees,
  redirectToSketchCheckout,
} from "../../../utils/sketchPaymentUtils.js";
import {
  formatBalancePayableRupees,
  getCadDownloadUiAction,
  normalizeCadDeliverableMeta,
  cadDownloadDenialMessage,
} from "../../../utils/cadDownloadEntitlement.js";
import {
  hasUploadedFiles,
  normalizeFileList,
  normalizeSingleFile,
  downloadRemoteFile,
} from "../../../utils/sketchFileUtils.js";

import { getSketchStatusLabel } from "../../../utils/lifecycleQc.js";
import SlaStatus from "../../../components/sla/SlaStatus.jsx";

const { Text } = Typography;
const AUDIO_ACCEPT = ".mp3,.wav,.m4a,.aac,.ogg";

const STATUS_COLORS = {
  PAYMENT_PENDING: "gold",
  PENDING: "warning",
  ASSIGNED: "processing",
  CAD_DELIVERED: "cyan",
  UNDER_REVIEW: "processing",
  UNDER_REVISION: "processing",
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
  const [downloadingByKey, setDownloadingByKey] = useState({});
  const [balancePaying, setBalancePaying] = useState(false);
  const [cadDownloading, setCadDownloading] = useState(false);

  const [fbRating, setFbRating] = useState(0);
  const [fbRemarks, setFbRemarks] = useState("");
  const [fbAudio, setFbAudio] = useState(null);
  const [fbAudioUploading, setFbAudioUploading] = useState(false);
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbIsRecording, setFbIsRecording] = useState(false);
  const [fbRecordingTime, setFbRecordingTime] = useState(0);
  const [fbAudioBlob, setFbAudioBlob] = useState(null);
  const [fbAudioUrl, setFbAudioUrl] = useState(null);
  const [fbMediaRecorder, setFbMediaRecorder] = useState(null);
  const fbTimerRef = useRef(null);
  const fbStreamRef = useRef(null);

  const [assignmentId, setAssignmentId] = useState(null);

  useEffect(() => {
    if (!details) {
      setAssignmentId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const uploadKey = String(uploadId || details._id || details.id || "");
      let id = resolveAssignmentIdFromEntity(details);
      if ((!id || id === uploadKey) && uploadKey) {
        id = await lookupAssignmentIdForSketch(
          uploadKey,
          resolveAssignedCadUserIdFromEntity(details)
        );
      }
      if (!cancelled) {
        setAssignmentId(id && id !== uploadKey ? id : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [details, uploadId]);

  const canGiveCadFeedback = useMemo(() => {
    const st = String(details?.status || "");
    return (
      Boolean(assignmentId) &&
      ["CAD_DELIVERED", "UNDER_REVIEW", "UNDER_REVISION", "APPROVED", "REJECTED"].includes(st)
    );
  }, [assignmentId, details?.status]);

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
          setFbRating(0);
          setFbRemarks("");
          setFbAudio(null);
          setFbAudioBlob(null);
          setFbAudioUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return null;
          });
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
  const showPaymentRetry = canRetrySketchPayment(details);
  const payableRupees = formatSketchPayableRupees(details);
  const revisionCount = Array.isArray(details?.revisionRequests)
    ? details.revisionRequests.length
    : 0;

  const singleUploadFiles = useMemo(
    () => normalizeFileList(details?.singleUpload),
    [details?.singleUpload]
  );
  const cadDeliverableFiles = useMemo(
    () => normalizeCadDeliverableMeta(details?.cadDeliverable),
    [details?.cadDeliverable]
  );
  const cadDownloadAction = useMemo(() => getCadDownloadUiAction(details), [details]);
  const balancePayableRupees = useMemo(
    () => formatBalancePayableRupees(details),
    [details]
  );
  const audioFile = useMemo(() => normalizeSingleFile(details?.audio), [details?.audio]);
  const isSingleUploadMode =
    details?.uploadMode === "single" || hasUploadedFiles(details?.singleUpload);

  useEffect(() => {
    if (!open || !uploadId || !details || !canGiveCadFeedback || !assignmentId) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const fb = await getAssignmentFeedback(assignmentId);
        if (cancelled) return;
        if (fb) {
          setFbRating(Number(fb.rating) || 0);
          setFbRemarks(fb.remarks || "");
          if (fb.audio?.url) {
            setFbAudio({
              url: fb.audio.url,
              fileName: fb.audio.fileName,
              mimeType: fb.audio.mimeType,
              size: fb.audio.size,
            });
          } else {
            setFbAudio(null);
          }
        } else {
          setFbRating(0);
          setFbRemarks("");
          setFbAudio(null);
        }
      } catch (e) {
        if (!cancelled) message.error(e?.message || "Failed to load CAD feedback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, uploadId, details?._id, assignmentId, canGiveCadFeedback]);

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
      message.error(getUploadErrorMessage(error) || "Audio upload failed");
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
      if (!navigator.mediaDevices?.getUserMedia) {
        message.error("Microphone is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
    } catch (err) {
      const blocked = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      message.error(
        blocked
          ? "Microphone blocked. Allow mic for this site, then hard-refresh (Ctrl+Shift+R)."
          : "Failed to access microphone. Check permissions."
      );
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
    // H-10: base MIME only (no ;codecs=) for audio/webm presign + S3 PUT
    await handleAudioUpload(toVoiceNoteFile(audioBlob));
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

      if (redirectToSketchCheckout(payment, uploadId)) {
        message.success("Redirecting to payment...");
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

  const handlePayBalance = async () => {
    if (!uploadId || balancePaying) return;
    setBalancePaying(true);
    try {
      const res = await initiateBalancePayment(uploadId);
      if (res?.data) setDetails(res.data);

      const payment = res?.meta?.payment;
      if (payment?.alreadyEntitled || payment?.requiresPayment === false) {
        message.success("Download already unlocked");
        const refreshed = await getSketchUploadById(uploadId);
        if (refreshed?.success && refreshed?.data) setDetails(refreshed.data);
        return;
      }

      if (
        redirectToSketchCheckout(payment, uploadId, {
          purpose: payment?.purpose || "CAD_BALANCE",
        })
      ) {
        message.success("Redirecting to balance payment...");
        return;
      }

      message.warning("Payment checkout URL was not returned. Please try again.");
    } catch (error) {
      message.error(error?.message || "Failed to start balance payment");
    } finally {
      setBalancePaying(false);
    }
  };

  const handleCadDownload = async () => {
    if (!uploadId || cadDownloading) return;
    setCadDownloading(true);
    try {
      const res = await getCadDownload(uploadId);
      const files = res?.data?.files;
      if (!Array.isArray(files) || files.length === 0) {
        throw new Error("No downloadable files returned");
      }
      if (res?.data?.downloadEntitlement) {
        setDetails((prev) =>
          prev
            ? { ...prev, downloadEntitlement: res.data.downloadEntitlement }
            : prev
        );
      }
      for (const file of files) {
        const url = file?.downloadUrl;
        if (!url) continue;
        await downloadRemoteFile(url, file.fileName || "cad-deliverable");
      }
      message.success(files.length > 1 ? "Downloads started" : "Download started");
    } catch (error) {
      const code = error?.code;
      message.error(cadDownloadDenialMessage(code) || error?.message || "Download failed");
      if (
        code === "BALANCE_PAYMENT_REQUIRED" ||
        code === "BALANCE_PAYMENT_PENDING" ||
        code === "BALANCE_PAYMENT_FAILED" ||
        code === "AMOUNT_MISMATCH" ||
        code === "BALANCE_REFUNDED"
      ) {
        try {
          const refreshed = await getSketchUploadById(uploadId);
          if (refreshed?.success && refreshed?.data) setDetails(refreshed.data);
        } catch {
          // ignore refresh errors
        }
      }
    } finally {
      setCadDownloading(false);
    }
  };

  const handleFbAudioUpload = async (file) => {
    if (!file || !assignmentId) return false;
    if (file.size > AUDIO_MAX_SIZE_BYTES) {
      message.error(`Max ${AUDIO_MAX_SIZE_BYTES / 1024 / 1024}MB`);
      return false;
    }
    setFbAudioUploading(true);
    try {
      const result = await uploadAudioToS3(file, String(assignmentId));
      setFbAudio({
        url: result?.fileUrl,
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      });
      setFbAudioBlob(null);
      setFbAudioUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      message.success("Audio uploaded");
    } catch (error) {
      message.error(getUploadErrorMessage(error) || "Audio upload failed");
    } finally {
      setFbAudioUploading(false);
    }
    return false;
  };

  const clearFbAudioSelection = () => {
    setFbAudio(null);
    setFbAudioBlob(null);
    setFbRecordingTime(0);
    setFbAudioUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return null;
    });
  };

  const startFbRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        message.error("Microphone is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      fbStreamRef.current = stream;
      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      }
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        setFbAudioBlob(blob);
        setFbAudioUrl(URL.createObjectURL(blob));
        if (fbStreamRef.current) {
          fbStreamRef.current.getTracks().forEach((track) => track.stop());
          fbStreamRef.current = null;
        }
      };

      recorder.start();
      setFbMediaRecorder(recorder);
      setFbIsRecording(true);
      setFbRecordingTime(0);
      fbTimerRef.current = setInterval(() => setFbRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      const blocked = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      message.error(
        blocked
          ? "Microphone blocked. Allow mic for this site, then hard-refresh (Ctrl+Shift+R)."
          : "Failed to access microphone. Check permissions."
      );
    }
  };

  const stopFbRecording = () => {
    if (!fbMediaRecorder || !fbIsRecording) return;
    fbMediaRecorder.stop();
    setFbIsRecording(false);
    if (fbTimerRef.current) {
      clearInterval(fbTimerRef.current);
      fbTimerRef.current = null;
    }
  };

  const uploadFbRecordedAudio = async () => {
    if (!fbAudioBlob || !assignmentId) return;
    const file = toVoiceNoteFile(fbAudioBlob);
    await handleFbAudioUpload(file);
  };

  const handleSubmitCadFeedback = async () => {
    if (!assignmentId || !canGiveCadFeedback || fbSubmitting) return;
    const ratingNum = Number(fbRating);
    if (!ratingNum || ratingNum < 0.5 || ratingNum > 5) {
      message.warning("Please choose a rating from 1 to 5 stars");
      return;
    }
    const body = { rating: ratingNum };
    const rem = String(fbRemarks || "").trim();
    if (rem) body.remarks = rem;
    if (fbAudio?.url) {
      body.audio = {
        url: fbAudio.url,
        fileName: fbAudio.fileName,
        mimeType: fbAudio.mimeType,
        size: fbAudio.size,
      };
    }
    setFbSubmitting(true);
    try {
      await submitAssignmentFeedback(assignmentId, body);
      message.success("Feedback saved");
      const fresh = await getAssignmentFeedback(assignmentId);
      if (fresh) {
        setFbRating(Number(fresh.rating) || 0);
        setFbRemarks(fresh.remarks || "");
        if (fresh.audio?.url) {
          setFbAudio({
            url: fresh.audio.url,
            fileName: fresh.audio.fileName,
            mimeType: fresh.audio.mimeType,
            size: fresh.audio.size,
          });
        } else {
          setFbAudio(null);
        }
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save feedback";
      message.error(msg);
    } finally {
      setFbSubmitting(false);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (fbTimerRef.current) clearInterval(fbTimerRef.current);
      if (fbStreamRef.current) {
        fbStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (fbAudioUrl) URL.revokeObjectURL(fbAudioUrl);
    },
    [audioUrl, fbAudioUrl]
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
                {getSketchStatusLabel(details.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="SLA / deadline">
              <SlaStatus entity={details} showPromise />
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

          {showPaymentRetry && (
            <Card size="small" title="Payment required">
              <p className="text-sm text-fg-muted mb-3">
                Complete payment to submit your sketch for processing.
                {payableRupees != null && (
                  <>
                    {" "}
                    Amount due: <span className="font-semibold text-fg">₹{Number(payableRupees).toFixed(2)}</span>
                  </>
                )}
              </p>
              {details?.sketchPayment?.status && (
                <p className="text-xs text-fg-muted mb-3">
                  Payment status: <Tag color="error">{details.sketchPayment.status}</Tag>
                </p>
              )}
              <SketchPaymentRetryButton uploadId={uploadId} upload={details} showAmount={false} />
            </Card>
          )}

          <Card size="small" title="Documents">
            {isSingleUploadMode ? (
              <div className="space-y-3">
                <p className="text-xs text-fg-muted">
                  Types: {selectedSingleDocTypes.length > 0 ? selectedSingleDocTypes.join(", ") : "-"}
                </p>
                {singleUploadFiles.length > 0 ? (
                  singleUploadFiles.map((file, index) => (
                    <div key={file.url || index} className="rounded-lg border border-line p-2 space-y-1">
                      <p className="text-sm font-semibold">{file.fileName || `Single Upload ${index + 1}`}</p>
                      <p className="text-xs text-fg-muted">
                        {file.mimeType || "Unknown"} - {formatFileSize(file.size)}
                      </p>
                      <FileViewDownloadButtons
                        url={file.url}
                        fileName={file.fileName || `single-upload-${index + 1}`}
                        viewLabel="View"
                        downloadLabel="Download"
                        downloadKey={file.url}
                        downloadingByKey={downloadingByKey}
                        setDownloadingByKey={setDownloadingByKey}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-fg-muted">No document uploaded.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {Object.keys(DOCUMENT_LABELS).map((key) => {
                  const files = normalizeFileList(details.documents?.[key]);
                  return (
                    <div key={key} className="rounded-lg border border-line p-2">
                      <p className="text-sm font-semibold">{DOCUMENT_LABELS[key]}</p>
                      {files.length > 0 ? (
                        <div className="space-y-2 mt-1">
                          {files.map((doc, index) => (
                            <div key={doc.url || index}>
                              <p className="text-xs text-fg-muted">{doc.fileName || `Document ${index + 1}`}</p>
                              <p className="text-xs text-fg-muted">
                                {doc.mimeType || "Unknown"} - {formatFileSize(doc.size)}
                              </p>
                              <FileViewDownloadButtons
                                url={doc.url}
                                fileName={doc.fileName || `${key}-${index + 1}`}
                                viewLabel="View"
                                downloadLabel="Download"
                                downloadKey={doc.url}
                                downloadingByKey={downloadingByKey}
                                setDownloadingByKey={setDownloadingByKey}
                              />
                            </div>
                          ))}
                        </div>
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
            {audioFile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <Text>{audioFile.fileName || "Audio file"}</Text>
                </div>
                <audio controls src={audioFile.url} className="w-full" preload="metadata">
                  Your browser does not support audio playback.
                </audio>
                <FileViewDownloadButtons
                  url={audioFile.url}
                  fileName={audioFile.fileName || "audio"}
                  viewLabel="Open"
                  downloadLabel="Download"
                  downloadKey={audioFile.url}
                  downloadingByKey={downloadingByKey}
                  setDownloadingByKey={setDownloadingByKey}
                />
              </div>
            ) : (
              <Text type="secondary">No audio uploaded.</Text>
            )}
          </Card>

          {cadDeliverableFiles.length > 0 && (
            <Card size="small" title="CAD Deliverables">
              <div className="space-y-3">
                {cadDeliverableFiles.map((file, index) => (
                  <div
                    key={`${file.fileName || "cad"}-${index}`}
                    className="rounded-lg border border-line p-2 space-y-1"
                  >
                    <p className="text-sm font-semibold">
                      {file.fileName || `CAD Deliverable ${index + 1}`}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {file.mimeType || "Unknown"} - {formatFileSize(file.size)}
                    </p>
                    {file.uploadedAt ? (
                      <p className="text-xs text-fg-muted">
                        Uploaded: {formatDate(file.uploadedAt)}
                      </p>
                    ) : null}
                  </div>
                ))}

                {cadDownloadAction === "download" && (
                  <Button
                    type="primary"
                    loading={cadDownloading}
                    onClick={handleCadDownload}
                    block
                  >
                    Download CAD files
                  </Button>
                )}

                {cadDownloadAction === "pay" && (
                  <div className="space-y-2">
                    <Alert
                      type="info"
                      showIcon
                      message={`Pay ₹${Number(balancePayableRupees).toFixed(
                        Number.isInteger(Number(balancePayableRupees)) ? 0 : 2
                      )} to unlock CAD download`}
                      description="CAD delivery alone does not unlock files. Complete the balance payment to download."
                    />
                    <Button
                      type="primary"
                      loading={balancePaying}
                      onClick={handlePayBalance}
                      block
                    >
                      Pay ₹
                      {Number(balancePayableRupees).toFixed(
                        Number.isInteger(Number(balancePayableRupees)) ? 0 : 2
                      )}{" "}
                      & download
                    </Button>
                  </div>
                )}

                {cadDownloadAction === "pending" && (
                  <div className="space-y-2">
                    <Alert
                      type="warning"
                      showIcon
                      message="Balance payment pending"
                      description="Complete PhonePe checkout, or retry if payment was interrupted."
                    />
                    <Button loading={balancePaying} onClick={handlePayBalance} block>
                      Retry balance payment
                    </Button>
                  </div>
                )}

                {cadDownloadAction === "refunded" && (
                  <Alert
                    type="error"
                    showIcon
                    message="Download blocked"
                    description="Balance payment was refunded. Contact support to resolve entitlement."
                  />
                )}
              </div>
            </Card>
          )}

          {Array.isArray(details?.revisionRequests) && details.revisionRequests.length > 0 && (
            <RevisionRequestsCard revisionRequests={details.revisionRequests} />
          )}

          {canRequestRevision && (
            <Card size="small" title="Request Revision">
              <div className="space-y-3">
                <p className="text-xs text-fg-muted">
                  Revisions requested: <span className="font-semibold text-fg">{revisionCount}</span>
                </p>
                <p className="text-xs text-fg-muted">
                  You can request a revision here. If a paid revision is required, you will be redirected to checkout using the server-quoted amount.
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

          {canGiveCadFeedback && (
            <Card size="small" title="Rate CAD user">
              <div className="space-y-3">
                <p className="text-xs text-fg-muted">
                  Share feedback for this assignment. Submitting again updates your previous feedback.
                </p>
                <div>
                  <div className="mb-1 text-xs font-semibold text-fg-muted">Rating (required)</div>
                  <Rate allowHalf value={fbRating} onChange={setFbRating} />
                </div>
                <Input.TextArea
                  rows={3}
                  placeholder="Remarks (optional)"
                  value={fbRemarks}
                  onChange={(e) => setFbRemarks(e.target.value)}
                  maxLength={2000}
                />
                <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-widest mb-0.5">
                    ಆಡಿಯೋ
                  </p>
                  <p className="text-sm font-extrabold text-fg mb-3">
                    Voice note <span className="text-fg-muted font-semibold text-xs">(optional)</span>
                  </p>

                  {!fbIsRecording && !fbAudioBlob && !fbAudio && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={startFbRecording}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] text-white font-extrabold text-sm transition-colors"
                      >
                        <Mic className="w-4 h-4" /> Record Audio
                      </button>
                      <Upload
                        accept={AUDIO_ACCEPT}
                        showUploadList={false}
                        beforeUpload={handleFbAudioUpload}
                        disabled={fbAudioUploading}
                      >
                        <button
                          type="button"
                          disabled={fbAudioUploading}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-line bg-surface hover:border-[color-mix(in_srgb,var(--user-accent)_35%,var(--border-color))] text-fg font-extrabold text-sm transition-colors"
                        >
                          <UploadIcon className="w-4 h-4" />
                          {fbAudioUploading ? "Uploading..." : "Upload File"}
                        </button>
                      </Upload>
                    </div>
                  )}

                  {fbIsRecording && (
                    <div className="flex items-center justify-between rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--danger)_25%,var(--border-color))] p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-danger flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-surface animate-pulse" />
                        </div>
                        <div>
                          <p className="font-extrabold text-danger text-sm">Recording...</p>
                          <p className="text-xs text-danger font-bold">{formatTime(fbRecordingTime)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={stopFbRecording}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-danger text-white font-extrabold text-sm"
                      >
                        <Square className="w-3.5 h-3.5" /> Stop
                      </button>
                    </div>
                  )}

                  {fbAudioBlob && fbAudioUrl && !fbAudio && (
                    <div className="space-y-3">
                      <audio controls src={fbAudioUrl} className="w-full rounded-xl" />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={uploadFbRecordedAudio}
                          disabled={fbAudioUploading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--user-accent)] hover:bg-[var(--user-accent-hover)] text-white font-extrabold text-sm disabled:opacity-60 transition-colors"
                        >
                          <UploadIcon className="w-4 h-4" />
                          {fbAudioUploading ? "Uploading..." : "Save Recording"}
                        </button>
                        <button
                          type="button"
                          onClick={clearFbAudioSelection}
                          disabled={fbAudioUploading}
                          className="px-4 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-[color-mix(in_srgb,var(--danger)_08%,var(--bg-secondary))] text-danger font-extrabold text-sm hover:opacity-90 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {fbAudio && (
                    <div className="rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,var(--bg-secondary))] border border-[color-mix(in_srgb,var(--success)_35%,var(--border-color))] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-extrabold text-success text-sm">✓ Audio saved</p>
                          <p className="text-xs text-success font-semibold truncate">
                            {fbAudio.fileName || "Audio attached"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearFbAudioSelection}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[color-mix(in_srgb,var(--danger)_35%,var(--border-color))] bg-surface text-danger font-bold text-xs hover:bg-surface-2 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                      {fbAudio.url && (
                        <audio controls src={fbAudio.url} className="w-full rounded-lg" />
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="primary"
                  onClick={handleSubmitCadFeedback}
                  loading={fbSubmitting}
                  disabled={fbAudioUploading || fbSubmitting}
                >
                  Save feedback
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
