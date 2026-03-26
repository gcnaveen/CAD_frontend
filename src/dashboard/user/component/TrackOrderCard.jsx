import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Drawer, Spin, message, Descriptions, Tag, Typography, Space } from "antd";
import { Eye, FileText, ExternalLink, Music } from "lucide-react";
import { getSketchUploadById } from "../../../services/surveyor/sketchUploadService.js";

const { Text, Paragraph } = Typography;

/**
 * Document field labels mapping (Normal mode)
 */
const DOCUMENT_LABELS = {
  moolaTippani: { en: "Moola Tippani", kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  hissaTippani: { en: "Hissa Tippani", kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  atlas: { en: "Atlas", kn: "ಅಟ್ಲಾಸ್" },
  rrPakkabook: { en: "RR Pakkabook", kn: "RR ಪಕ್ಕಬುಕ್" },
  kharabu: { en: "Kharabu", kn: "ಖರಾಬು ಉತಾರ್" },
};

/**
 * Document type labels for Single Upload mode (checkbox keys)
 */
const SINGLE_MODE_DOCUMENT_LABELS = {
  is_originaltippani: { en: "Moola Tippani", kn: "ಮೂಲ ಟಿಪ್ಪಣಿ" },
  is_hissatippani: { en: "Hissa Tippani", kn: "ಹಿಸ್ಸ ಟಿಪ್ಪಣಿ" },
  is_atlas: { en: "Atlas", kn: "ಅಟ್ಲಾಸ್" },
  is_rrpakkabook: { en: "RR Pakkabook", kn: "RR ಪಕ್ಕಬುಕ್" },
  is_akarabandu: { en: "Akarabandu", kn: "ಆಕಾರಬಂದು" },
  is_kharabuttar: { en: "Kharab Utthar", kn: "ಖರಾಬ್ ಉತ್ತರ" },
  is_mulapatra: { en: "Moola Patra", kn: "ಮೂಲ ಪತ್ರ" },
};

/**
 * Status display mapping
 */
const STATUS_DISPLAY = {
  PENDING: "Pending Review",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/**
 * Status color mapping
 */
const getStatusColor = (status) => {
  const colorMap = {
    PENDING: "warning",
    UNDER_REVIEW: "processing",
    APPROVED: "success",
    REJECTED: "error",
  };
  return colorMap[status] || "default";
};

/**
 * Format file size
 */
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Format date to readable string
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

/**
 * Reusable order tracking card with view-details drawer.
 * @param {string} projectNo - Project number (e.g. "1")
 * @param {string} status - Current order status display text (e.g. "Pending Review")
 * @param {string} statusType - API status type (e.g. "PENDING", "APPROVED") for color coding
 * @param {string} uploadId - Upload ID to fetch details
 * @param {function} onViewDetails - Optional callback when view details is clicked
 */
const TrackOrderCard = ({
  projectNo = "1",
  status = "CAD in Progress",
  statusType,
  uploadId,
  onViewDetails,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const fetchOrderDetails = useCallback(async () => {
    if (!uploadId) return;

    setLoadingDetails(true);
    setOrderDetails(null);

    try {
      const response = await getSketchUploadById(uploadId);

      if (response?.success && response?.data) {
        setOrderDetails(response.data);
      } else {
        message.error("Failed to load order details");
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      message.error(error.message || "Failed to load order details");
    } finally {
      setLoadingDetails(false);
    }
  }, [uploadId]);

  useEffect(() => {
    if (drawerOpen && uploadId) {
      fetchOrderDetails();
    }
  }, [drawerOpen, uploadId, fetchOrderDetails]);

  const handleViewDetails = () => {
    onViewDetails?.(projectNo);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setOrderDetails(null);
  };

  // Get surveyor name
  const getSurveyorName = () => {
    if (!orderDetails?.surveyor) return "-";
    const { name } = orderDetails.surveyor;
    if (name?.first && name?.last) {
      return `${name.first} ${name.last}`;
    }
    return name?.first || name?.last || "-";
  };

  // Get location display (name + code)
  const getLocationDisplay = (location) => {
    if (!location) return "-";
    if (typeof location === "string") return location;
    const name = location.name || "-";
    const code = location.code ? ` (${location.code})` : "";
    return `${name}${code}`;
  };

  return (
    <>
      <Card
        className="order-tracking-card overflow-hidden border-line shadow-sm transition-shadow hover:shadow-md"
        bordered
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-fg text-base sm:text-lg">
                Project No. {projectNo}
              </p>
              <p className="mt-0.5 flex items-center gap-2">
                <span className="text-sm text-fg-muted">
                  Current order status:
                </span>
                <Tag color={getStatusColor(statusType)}>
                  {status}
                </Tag>
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<Eye className="h-4 w-4" />}
            onClick={handleViewDetails}
            className="w-full shrink-0 sm:w-auto"
            size="large"
          >
            View details
          </Button>
        </div>
      </Card>

      <Drawer
        title={
          <span className="font-semibold text-fg text-lg">
            Order Details – Project No. {projectNo}
          </span>
        }
        placement="right"
        width="min(100vw, 600px)"
        onClose={handleDrawerClose}
        open={drawerOpen}
        destroyOnClose
        footer={null}
        styles={{
          body: { paddingBottom: 24 },
        }}
        classNames={{
          content: "flex flex-col",
          body: "flex-1 overflow-y-auto",
        }}
      >
        {loadingDetails ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Surveyor Information */}
            <Descriptions
              title="Surveyor Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Name">
                {getSurveyorName()}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {orderDetails.surveyor?.role || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Survey Information */}
            <Descriptions
              title="Survey Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Survey Type">
                <Tag>
                  {orderDetails.surveyType === "joint_flat"
                    ? "Joint Flat"
                    : orderDetails.surveyType === "single_flat"
                    ? "Single Flat"
                    : orderDetails.surveyType || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="District">
                {getLocationDisplay(orderDetails.district)}
              </Descriptions.Item>
              <Descriptions.Item label="Taluka">
                {getLocationDisplay(orderDetails.taluka)}
              </Descriptions.Item>
              <Descriptions.Item label="Hobli">
                {getLocationDisplay(orderDetails.hobli)}
              </Descriptions.Item>
              <Descriptions.Item label="Village">
                {getLocationDisplay(orderDetails.village)}
              </Descriptions.Item>
              <Descriptions.Item label="Survey No">
                {orderDetails.surveyNo || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Application ID">
                <Text strong>{orderDetails.applicationId || "-"}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Status Information */}
            <Descriptions
              title="Status Information"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(orderDetails.status)}>
                  {STATUS_DISPLAY[orderDetails.status] || orderDetails.status || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status Note">
                {orderDetails.statusNote || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Others">
                {orderDetails.others || "-"}
              </Descriptions.Item>
            </Descriptions>

            {/* Timestamps */}
            <Descriptions
              title="Timestamps"
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Created At">
                {formatDate(orderDetails.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {formatDate(orderDetails.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            {/* Documents Section */}
            <div>
              <h3 className="mb-4 text-base font-semibold text-fg">
                Documents
              </h3>
              {(orderDetails.uploadMode === "single" || orderDetails.singleUpload) ? (
                /* Single Upload Mode */
                <div className="space-y-4">
                  <Card size="small" className="border-line">
                    <div className="mb-2">
                      <Tag color="blue">Single Upload</Tag>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Text strong className="text-sm">
                          Uploaded Document / ಅಪ್ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆ
                        </Text>
                        {orderDetails.singleUpload?.url ? (
                          <div className="mt-2 space-y-1">
                            <div>
                              <Text type="secondary" className="text-xs">
                                File: {orderDetails.singleUpload.fileName || "Unknown"}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary" className="text-xs">
                                Type: {orderDetails.singleUpload.mimeType || "Unknown"} • Size:{" "}
                                {formatFileSize(orderDetails.singleUpload.size)}
                              </Text>
                            </div>
                            {orderDetails.singleUpload.uploadedAt && (
                              <div>
                                <Text type="secondary" className="text-xs">
                                  Uploaded: {formatDate(orderDetails.singleUpload.uploadedAt)}
                                </Text>
                              </div>
                            )}
                            <div className="mt-2">
                              <Text type="secondary" className="text-xs block">
                                Document types:{" "}
                                {Object.keys(SINGLE_MODE_DOCUMENT_LABELS)
                                  .filter((key) => orderDetails[key] === true)
                                  .map((key) => SINGLE_MODE_DOCUMENT_LABELS[key].en)
                                  .join(", ") || "-"}
                              </Text>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Text type="secondary" className="text-xs">
                              No document
                            </Text>
                          </div>
                        )}
                      </div>
                      {orderDetails.singleUpload?.url && (
                        <Button
                          type="link"
                          icon={<ExternalLink className="h-4 w-4" />}
                          onClick={() => window.open(orderDetails.singleUpload.url, "_blank")}
                          size="small"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>
              ) : (
                /* Normal Upload Mode */
                <div className="space-y-4">
                  {Object.keys(DOCUMENT_LABELS).map((fieldName) => {
                    const doc = orderDetails.documents?.[fieldName];
                    const label = DOCUMENT_LABELS[fieldName];

                    return (
                      <Card
                        key={fieldName}
                        size="small"
                        className="border-line"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Text strong className="text-sm">
                              {label.en} / {label.kn}
                            </Text>
                            {doc && doc.url ? (
                              <div className="mt-2 space-y-1">
                                <div>
                                  <Text type="secondary" className="text-xs">
                                    File: {doc.fileName || "Unknown"}
                                  </Text>
                                </div>
                                <div>
                                  <Text type="secondary" className="text-xs">
                                    Type: {doc.mimeType || "Unknown"} • Size:{" "}
                                    {formatFileSize(doc.size)}
                                  </Text>
                                </div>
                                {doc.uploadedAt && (
                                  <div>
                                    <Text type="secondary" className="text-xs">
                                      Uploaded: {formatDate(doc.uploadedAt)}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-2">
                                <Text type="secondary" className="text-xs">
                                  Not uploaded
                                </Text>
                              </div>
                            )}
                          </div>
                          {doc && doc.url && (
                            <Button
                              type="link"
                              icon={<ExternalLink className="h-4 w-4" />}
                              onClick={() => window.open(doc.url, "_blank")}
                              size="small"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Other Documents (both modes) */}
              {orderDetails.other_documents && Array.isArray(orderDetails.other_documents) && orderDetails.other_documents.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium text-fg">
                    Other Documents / ಇತರೆ ದಾಖಲೆಗಳು
                  </h4>
                  <div className="space-y-2">
                    {orderDetails.other_documents.map((doc, index) => (
                      <Card key={doc.url || index} size="small" className="border-line">
                        <div className="flex items-start justify-between">
                          <div>
                            <Text strong className="text-sm">
                              {doc.fileName || "Document"}
                            </Text>
                            <div>
                              <Text type="secondary" className="text-xs">
                                {doc.mimeType || ""} • {formatFileSize(doc.size)}
                              </Text>
                            </div>
                          </div>
                          {doc.url && (
                            <Button
                              type="link"
                              icon={<ExternalLink className="h-4 w-4" />}
                              onClick={() => window.open(doc.url, "_blank")}
                              size="small"
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audio Section */}
            <div>
              <h3 className="mb-4 text-base font-semibold text-fg">
                Audio / ಆಡಿಯೋ
              </h3>
              {orderDetails.audio?.url ? (
                <Card size="small" className="border-line">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-fg-muted shrink-0" />
                        <Text strong className="text-sm">
                          {orderDetails.audio.fileName || "Audio file"}
                        </Text>
                      </div>
                      <div className="space-y-1">
                        <Text type="secondary" className="text-xs block">
                          Type: {orderDetails.audio.mimeType || "–"} • Size:{" "}
                          {formatFileSize(orderDetails.audio.size)}
                        </Text>
                        {orderDetails.audio.uploadedAt && (
                          <Text type="secondary" className="text-xs block">
                            Uploaded: {formatDate(orderDetails.audio.uploadedAt)}
                          </Text>
                        )}
                      </div>
                      <div className="mt-3">
                        <audio
                          controls
                          src={orderDetails.audio.url}
                          className="w-full max-w-md h-9"
                          preload="metadata"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                    <Button
                      type="link"
                      icon={<ExternalLink className="h-4 w-4" />}
                      onClick={() =>
                        window.open(orderDetails.audio.url, "_blank")
                      }
                      size="small"
                      className="shrink-0"
                    >
                      Open
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card size="small" className="border-line">
                  <Text type="secondary" className="text-sm">
                    No audio uploaded
                  </Text>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Text type="secondary">No details available</Text>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default TrackOrderCard;
