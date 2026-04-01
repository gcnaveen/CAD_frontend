import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Typography,
  Space,
  Divider,
  Select,
  Input,
  Button,
  Tag,
  List,
  Card,
  message,
  Descriptions,
  Spin,
} from "antd";
import {
  FileOutlined,
  LinkOutlined,
  UserOutlined,
  DollarOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import apiClient from "../../../services/apiClient.js";
import { getCadUsers, formatUserDisplayLabel } from "../../../services/assignmentApi.js";

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS = [
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "need_changes", label: "Need Changes" },
];

const PAYMENT_STATUS_MAP = {
  paid: { color: "green", text: "Paid" },
  pending: { color: "orange", text: "Pending" },
  unpaid: { color: "red", text: "Unpaid" },
};

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
  ASSIGNED: "Assigned",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

/**
 * Status color mapping
 */
const getStatusColor = (status) => {
  const colorMap = {
    PENDING: "warning",
    ASSIGNED: "processing",
    UNDER_REVIEW: "processing",
    APPROVED: "success",
    REJECTED: "error",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    ON_HOLD: "default",
    CANCELLED: "error",
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
 * Convert a Date into the local `datetime-local` input format: `YYYY-MM-DDTHH:mm`
 * (no timezone information in the string).
 */
const toDatetimeLocalValue = (date) => {
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
};

const ProjectOrderDetailDrawer = ({
  open,
  onClose,
  order,
  onSave,
  readOnly = false,
  loading = false,
}) => {
  const [assignedCadUser, setAssignedCadUser] = useState(null);
  const [status, setStatus] = useState("approved");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [minDueDate, setMinDueDate] = useState("");
  const [cadUsers, setCadUsers] = useState([]);
  const [cadUsersLoading, setCadUsersLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const clearedDueDateWarningShownRef = useRef(false);

  // Fetch CAD users when drawer opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchCadUsers = async () => {
      setCadUsersLoading(true);
      try {
        const filteredCadUsers = await getCadUsers();
        if (!cancelled) setCadUsers(filteredCadUsers);
      } catch (err) {
        if (!cancelled) {
          message.error(err.response?.data?.message || "Failed to load CAD users");
          setCadUsers([]);
        }
      } finally {
        if (!cancelled) setCadUsersLoading(false);
      }
    };
    fetchCadUsers();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const min = new Date();
    min.setSeconds(0, 0);
    setMinDueDate(toDatetimeLocalValue(min));
    clearedDueDateWarningShownRef.current = false;
  }, [open]);

  useEffect(() => {
    if (order) {
      setAssignedCadUser(order.assignedCadCenterId || null);
      // Map API status to drawer status format
      const statusMap = {
        PENDING: "approved",
        UNDER_REVIEW: "approved",
        APPROVED: "approved",
        REJECTED: "rejected",
      };
      setStatus(statusMap[order.status] || order.status || "approved");
      setNote(order.statusNote || order.note || "");

      if (!order.dueDate) {
        setDueDate("");
        return;
      }

      // Convert API ISO date (UTC) -> local `datetime-local` string.
      const apiDueDateDate = new Date(order.dueDate);
      if (Number.isNaN(apiDueDateDate.getTime())) {
        setDueDate("");
        return;
      }

      const apiDueDateValue = toDatetimeLocalValue(apiDueDateDate);

      // Prevent showing/using a dueDate that is already in the past.
      // `datetime-local` is local time, so we compare using local Date parsing.
      const minDate = minDueDate ? new Date(minDueDate) : (() => {
        const d = new Date();
        d.setSeconds(0, 0);
        return d;
      })();

      if (apiDueDateDate < minDate) {
        setDueDate("");
        if (!readOnly && !clearedDueDateWarningShownRef.current) {
          clearedDueDateWarningShownRef.current = true;
          message.warning("Existing due date is in the past. Please select an upcoming due date.");
        }
        return;
      }

      setDueDate(apiDueDateValue);
    }
  }, [order, minDueDate, readOnly]);

  const handleSave = async () => {
    if (!order?._id) {
      message.error("Order not loaded.");
      return;
    }
    if (!assignedCadUser) {
      message.warning("Please select a CAD user.");
      return;
    }
    setSaveLoading(true);
    try {
      // Guard against saving a past dueDate.
      if (dueDate) {
        const selected = new Date(dueDate);
        const minDate = minDueDate ? new Date(minDueDate) : (() => {
          const d = new Date();
          d.setSeconds(0, 0);
          return d;
        })();
        if (selected < minDate) {
          message.error("Due date must be an upcoming date/time.");
          return;
        }
      }

      const payload = {
        surveyorSketchUploadId: order._id,
        cadCenterId: assignedCadUser,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: typeof note === "string" ? note : String(note ?? ""),
      };
      await apiClient.post("/api/admin/survey-sketch-assignments", payload);
      message.success("Assignment saved successfully.");
      if (onSave) {
        onSave({
          ...order,
          assignedCadCenterId: assignedCadUser,
          status,
          note: status === "need_changes" ? note : "",
          dueDate: payload.dueDate,
        });
      }
      onClose?.();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to save assignment");
    } finally {
      setSaveLoading(false);
    }
  };

  // Get surveyor name
  const getSurveyorName = () => {
    if (!order?.surveyor) return "-";
    const { name } = order.surveyor;
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

  if (!order && !loading) return null;

  const paymentInfo = PAYMENT_STATUS_MAP[order?.paymentStatus] || PAYMENT_STATUS_MAP.pending;
  const showNote = status === "need_changes";

  return (
    <Drawer
      title={
        <span className="font-semibold text-fg text-lg">
          Order Details {order?.applicationId ? `– Application ID: ${order.applicationId}` : ""}
        </span>
      }
      placement="right"
      width="min(100vw, 800px)"
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={
        !readOnly &&
        onSave && (
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={saveLoading}>
              Save Changes
            </Button>
          </Space>
        )
      }
      styles={{ body: { paddingBottom: 24 } }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : order ? (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {/* Surveyor Information */}
          {order.surveyor && (
            <>
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
                  {order.surveyor?.role || "-"}
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: "8px 0" }} />
            </>
          )}

          {/* Survey Information */}
          <Descriptions
            title="Survey Information"
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Survey Type">
              <Tag>
                {order.surveyType === "joint_flat"
                  ? "Joint Flat"
                  : order.surveyType === "single_flat"
                  ? "Single Flat"
                  : order.surveyType || "-"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="District">
              {getLocationDisplay(order.district)}
            </Descriptions.Item>
            <Descriptions.Item label="Taluka">
              {getLocationDisplay(order.taluka)}
            </Descriptions.Item>
            <Descriptions.Item label="Hobli">
              {getLocationDisplay(order.hobli)}
            </Descriptions.Item>
            <Descriptions.Item label="Village">
              {getLocationDisplay(order.village)}
            </Descriptions.Item>
            <Descriptions.Item label="Survey No">
              {order.surveyNo || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Application ID">
              <Text strong>{order.applicationId || order._id || "-"}</Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "8px 0" }} />

          {/* Documents Section */}
          <Card size="small" title="Uploaded Documents" style={{ marginBottom: 0 }}>
            {(order.uploadMode === "single" || order.singleUpload) ? (
              /* Single Upload Mode */
              <div className="space-y-4">
                <Card size="small" className="border-line" style={{ marginBottom: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color="blue">Single Upload</Tag>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Text strong className="text-sm">
                        Uploaded Document / ಅಪ್ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆ
                      </Text>
                      {order.singleUpload?.url ? (
                        <div className="mt-2 space-y-1">
                          <div>
                            <Text type="secondary" className="text-xs">
                              File: {order.singleUpload.fileName || "Unknown"}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary" className="text-xs">
                              Type: {order.singleUpload.mimeType || "Unknown"} • Size:{" "}
                              {formatFileSize(order.singleUpload.size)}
                            </Text>
                          </div>
                          {order.singleUpload.uploadedAt && (
                            <div>
                              <Text type="secondary" className="text-xs">
                                Uploaded: {formatDate(order.singleUpload.uploadedAt)}
                              </Text>
                            </div>
                          )}
                          <div className="mt-2">
                            <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                              Document types:{" "}
                              {Object.keys(SINGLE_MODE_DOCUMENT_LABELS)
                                .filter((key) => order[key] === true)
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
                    {order.singleUpload?.url && (
                      <Button
                        type="link"
                        icon={<LinkOutlined />}
                        onClick={() => window.open(order.singleUpload.url, "_blank")}
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
                  const doc = order.documents?.[fieldName];
                  const label = DOCUMENT_LABELS[fieldName];

                  return (
                    <Card
                      key={fieldName}
                      size="small"
                      className="border-line"
                      style={{ marginBottom: 8 }}
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
                            icon={<LinkOutlined />}
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
          </Card>

          {/* Other Documents (from API other_documents array) */}
          {order.other_documents && Array.isArray(order.other_documents) && order.other_documents.length > 0 && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <Card size="small" title="Other Documents" style={{ marginBottom: 0 }}>
                <List
                  size="small"
                  dataSource={order.other_documents}
                  renderItem={(doc, index) => (
                    <List.Item
                      key={doc.url || index}
                      actions={
                        doc.url
                          ? [
                              <Button
                                type="link"
                                icon={<LinkOutlined />}
                                onClick={() => window.open(doc.url, "_blank")}
                                size="small"
                              >
                                View
                              </Button>,
                            ]
                          : []
                      }
                    >
                      <div>
                        <Text strong className="text-sm">
                          {doc.fileName || "Document"}
                        </Text>
                        <div>
                          <Text type="secondary" className="text-xs">
                            {doc.mimeType || ""} • {formatFileSize(doc.size)}
                            {doc.uploadedAt ? ` • Uploaded: ${formatDate(doc.uploadedAt)}` : ""}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </>
          )}

          {/* CAD Deliverable (shown only when delivered file exists) */}
          {order.cadDeliverable?.url && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <Card size="small" title="CAD Deliverable" style={{ marginBottom: 0 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Text strong className="text-sm">
                      {order.cadDeliverable.fileName || "CAD Deliverable"}
                    </Text>
                    <div className="space-y-1" style={{ marginTop: 8 }}>
                      <Text type="secondary" className="text-xs block">
                        Type: {order.cadDeliverable.mimeType || "Unknown"} • Size:{" "}
                        {formatFileSize(order.cadDeliverable.size)}
                      </Text>
                      {order.cadDeliverable.uploadedAt && (
                        <Text type="secondary" className="text-xs block">
                          Uploaded: {formatDate(order.cadDeliverable.uploadedAt)}
                        </Text>
                      )}
                    </div>
                  </div>
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    onClick={() => window.open(order.cadDeliverable.url, "_blank")}
                    size="small"
                  >
                    View
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Audio Section */}
          <Divider style={{ margin: "8px 0" }} />
          <Card size="small" title="Audio / ಆಡಿಯೋ" style={{ marginBottom: 0 }}>
            {order.audio?.url ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <SoundOutlined style={{ color: "var(--text-secondary)" }} />
                    <Text strong className="text-sm">
                      {order.audio.fileName || "Audio file"}
                    </Text>
                  </div>
                  <div className="space-y-1">
                    <Text type="secondary" className="text-xs block">
                      Type: {order.audio.mimeType || "–"} • Size:{" "}
                      {formatFileSize(order.audio.size)}
                    </Text>
                    {order.audio.uploadedAt && (
                      <Text type="secondary" className="text-xs block">
                        Uploaded: {formatDate(order.audio.uploadedAt)}
                      </Text>
                    )}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <audio
                      controls
                      src={order.audio.url}
                      style={{ width: "100%", maxWidth: 400, height: 36 }}
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
                <Button
                  type="link"
                  icon={<LinkOutlined />}
                  onClick={() => window.open(order.audio.url, "_blank")}
                  size="small"
                >
                  Open
                </Button>
              </div>
            ) : (
              <Text type="secondary" className="text-sm">
                No audio uploaded
              </Text>
            )}
          </Card>

          <Divider style={{ margin: "8px 0" }} />

          {/* Status Information */}
          <Descriptions
            title="Status Information"
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(order.status)}>
                {STATUS_DISPLAY[order.status] || order.status || "-"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status Note">
              {order.statusNote ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Others">
              {order.others ?? "-"}
            </Descriptions.Item>
            {order.reviewedAt != null && (
              <Descriptions.Item label="Reviewed At">
                {formatDate(order.reviewedAt)}
              </Descriptions.Item>
            )}
            {order.reviewedBy != null && (
              <Descriptions.Item label="Reviewed By">
                {typeof order.reviewedBy === "object"
                  ? order.reviewedBy?.name
                    ? [order.reviewedBy.name.first, order.reviewedBy.name.last].filter(Boolean).join(" ")
                    : order.reviewedBy?.email || "-"
                  : String(order.reviewedBy)}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider style={{ margin: "8px 0" }} />

          {/* Timestamps */}
          <Descriptions
            title="Timestamps"
            bordered
            column={1}
            size="small"
          >
            <Descriptions.Item label="Created At">
              {formatDate(order.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatDate(order.updatedAt)}
            </Descriptions.Item>
          </Descriptions>

          <Divider style={{ margin: "8px 0" }} />

          {/* Assigned to - CAD User */}
          <Card size="small" title="Assigned To">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>CAD User</Text>
                <Select
                  placeholder="Select CAD User"
                  style={{ width: "100%", maxWidth: 400 }}
                  value={assignedCadUser}
                  onChange={setAssignedCadUser}
                  disabled={readOnly}
                  loading={cadUsersLoading}
                  options={cadUsers.map((u) => ({
                    value: u.id || u._id,
                    label: formatUserDisplayLabel(u) || String(u.id || u._id),
                  }))}
                  suffixIcon={<UserOutlined />}
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Due Date</Text>
                <Input
                  type="datetime-local"
                      min={minDueDate || undefined}
                      step={60}
                  style={{ width: "100%", maxWidth: 400 }}
                  value={dueDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          setDueDate("");
                          return;
                        }

                        const selected = new Date(value);
                        const minDate = minDueDate ? new Date(minDueDate) : (() => {
                          const d = new Date();
                          d.setSeconds(0, 0);
                          return d;
                        })();
                        if (selected < minDate) {
                          message.warning("Due date must be an upcoming date/time.");
                          return;
                        }

                        setDueDate(value);
                      }}
                  disabled={readOnly}
                />
              </div>
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Notes</Text>
                <TextArea
                  rows={3}
                  placeholder="Add notes for this assignment (submitted as string)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={readOnly}
                  style={{ width: "100%", maxWidth: 400 }}
                />
              </div>
            </Space>
          </Card>

          <Divider style={{ margin: "8px 0" }} />

          {/* Status & Note for revert/changes */}
          <Card size="small" title="Review & Notes">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Status
                </Text>
                <Select
                  style={{ width: "100%", maxWidth: 280 }}
                  value={status}
                  onChange={setStatus}
                  disabled={readOnly}
                  options={STATUS_OPTIONS}
                />
              </div>
              {showNote && (
                <div>
                  <Text strong style={{ display: "block", marginBottom: 8 }}>
                    Note for revert or changes in uploaded CAD files
                  </Text>
                  <TextArea
                    rows={4}
                    placeholder="Describe required changes or revert reason..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              )}
            </Space>
          </Card>

          {order.paymentStatus && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              {/* Payment status */}
              <Card size="small" title="Payment Status">
                <Space align="center">
                  <DollarOutlined style={{ fontSize: 18, color: "var(--success)" }} />
                  <Tag color={paymentInfo.color}>{paymentInfo.text}</Tag>
                </Space>
              </Card>
            </>
          )}
        </Space>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">No order details available</Text>
        </div>
      )}
    </Drawer>
  );
};

export default ProjectOrderDetailDrawer;
export { PAYMENT_STATUS_MAP, STATUS_OPTIONS };
