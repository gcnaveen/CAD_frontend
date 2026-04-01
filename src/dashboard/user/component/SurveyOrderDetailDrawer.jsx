import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Descriptions, Drawer, Spin, Tag, Typography, message } from "antd";
import { ExternalLink, Music } from "lucide-react";
import { getSketchUploadById } from "../../../services/surveyor/sketchUploadService.js";

const { Text } = Typography;

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

  useEffect(() => {
    const load = async () => {
      if (!open || !uploadId) return;
      setLoading(true);
      setDetails(null);
      try {
        const res = await getSketchUploadById(uploadId);
        if (res?.success && res?.data) {
          setDetails(res.data);
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
        </div>
      )}
    </Drawer>
  );
};

export default SurveyOrderDetailDrawer;
