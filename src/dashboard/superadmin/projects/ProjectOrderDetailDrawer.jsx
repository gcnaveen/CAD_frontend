import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
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
import {
  cacheAssignmentIdForSketch,
  canPullbackSketchEntity,
  createAssignment,
  getCadUsers,
  lookupAssignmentIdForSketch,
  pullbackReassignAssignment,
  updateAssignment,
  resolveAssignedCadUserIdFromEntity,
  formatUserDisplayLabel,
} from "../../../services/assignmentApi.js";
import PullbackReassignModal from "../../../components/assignments/PullbackReassignModal.jsx";
import { ROLES, normalizeRoleKey, resolveStoredUserRole } from "../../../constants/roles.js";
import CadWalletPayoutSection from "../../../components/cadWallet/CadWalletPayoutSection.jsx";
import FileViewDownloadButtons from "../../../components/files/FileViewDownloadButtons.jsx";
import {
  hasUploadedFiles,
  normalizeFileList,
  normalizeSingleFile,
} from "../../../utils/sketchFileUtils.js";

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
  UNDER_REVISION: "Under Revision",
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
    UNDER_REVISION: "processing",
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
  onOrderRefresh,
  allowPullback = false,
  readOnly = false,
  loading = false,
}) => {
  const roleFromStore = useSelector((s) => s.auth?.role);
  const userRoleFromStore = useSelector((s) => s.auth?.user?.role);
  const roleKey = useMemo(
    () => normalizeRoleKey(resolveStoredUserRole(roleFromStore, userRoleFromStore)),
    [roleFromStore, userRoleFromStore]
  );
  const canManagePullback = useMemo(
    () => allowPullback && !readOnly && (roleKey === ROLES.ADMIN || roleKey === ROLES.SUPER_ADMIN),
    [allowPullback, readOnly, roleKey]
  );
  const canManageCadWallet = useMemo(() => {
    return !readOnly && roleKey === ROLES.SUPER_ADMIN;
  }, [readOnly, roleKey]);
  const [assignedCadUser, setAssignedCadUser] = useState(null);
  const [status, setStatus] = useState("approved");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [minDueDate, setMinDueDate] = useState("");
  const [cadUsers, setCadUsers] = useState([]);
  const [cadUsersLoading, setCadUsersLoading] = useState(false);
  const [pullbackOpen, setPullbackOpen] = useState(false);
  const [pullbackSketch, setPullbackSketch] = useState(null);
  const [pullbackAssignmentId, setPullbackAssignmentId] = useState(null);
  const [pullbackResolving, setPullbackResolving] = useState(false);
  const [pullbackSubmitting, setPullbackSubmitting] = useState(false);
  const [pullbackError, setPullbackError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [downloadingByKey, setDownloadingByKey] = useState({});
  const clearedDueDateWarningShownRef = useRef(false);

  const singleUploadFiles = useMemo(
    () => normalizeFileList(order?.singleUpload),
    [order?.singleUpload]
  );
  const cadDeliverableFiles = useMemo(
    () => normalizeFileList(order?.cadDeliverable),
    [order?.cadDeliverable]
  );
  const audioFile = useMemo(() => normalizeSingleFile(order?.audio), [order?.audio]);
  const isSingleUploadMode =
    order?.uploadMode === "single" || hasUploadedFiles(order?.singleUpload);

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
      setAssignedCadUser(
        resolveAssignedCadUserIdFromEntity(order) || order.assignedCadCenterId || null
      );
      // Map API status to drawer status format
      const statusMap = {
        PENDING: "approved",
        UNDER_REVIEW: "approved",
        UNDER_REVISION: "approved",
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

  const closePullback = () => {
    setPullbackOpen(false);
    setPullbackSketch(null);
    setPullbackAssignmentId(null);
    setPullbackError("");
    setPullbackResolving(false);
    setPullbackSubmitting(false);
  };

  const handlePullbackOpen = async () => {
    if (!order) return;
    setPullbackError("");
    setPullbackSketch(order);
    setPullbackAssignmentId(order.assignmentId ?? null);
    setPullbackOpen(true);
    setPullbackResolving(true);

    try {
      const usersPromise = cadUsers.length ? Promise.resolve(cadUsers) : getCadUsers();
      const [users, resolvedId] = await Promise.all([
        usersPromise,
        order.assignmentId
          ? Promise.resolve(order.assignmentId)
          : lookupAssignmentIdForSketch(
              order._id ?? order.id,
              assignedCadUser ??
                resolveAssignedCadUserIdFromEntity(order) ??
                order.assignedCadCenterId
            ),
      ]);

      if (!cadUsers.length) setCadUsers(users);

      if (resolvedId) {
        setPullbackAssignmentId(String(resolvedId));
        setPullbackSketch({ ...order, assignmentId: String(resolvedId) });
      } else {
        setPullbackError(
          "Assignment id not found. Select a CAD user above, click Save Changes, then try pull back again."
        );
      }
    } catch (err) {
      setPullbackError(err?.message || "Failed to prepare pull back");
    } finally {
      setPullbackResolving(false);
    }
  };

  const handlePullbackSubmit = async ({ assignedCadUserId }) => {
    let assignmentId = order?.assignmentId ?? pullbackAssignmentId;
    const uploadId = order?._id ?? order?.id ?? pullbackSketch?._id;

    if (!assignmentId && uploadId) {
      assignmentId = await lookupAssignmentIdForSketch(
        uploadId,
        resolveAssignedCadUserIdFromEntity(order ?? pullbackSketch) ??
          assignedCadUser ??
          assignedCadUserId
      );
    }

    if (!assignmentId) {
      setPullbackError(
        "Missing assignment id. Select CAD user, Save Changes, then try pull back again."
      );
      return;
    }

    setPullbackSubmitting(true);
    setPullbackError("");
    try {
      await pullbackReassignAssignment(assignmentId, { assignedCadUserId });
      if (order?._id) {
        cacheAssignmentIdForSketch(order._id, assignmentId);
      }
      message.success("Assignment pulled back and reassigned");
      closePullback();
      await onOrderRefresh?.();
    } catch (err) {
      setPullbackError(err?.message || "Failed to pull back assignment");
    } finally {
      setPullbackSubmitting(false);
    }
  };

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
        assignedCadUserId: assignedCadUser,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: typeof note === "string" ? note : String(note ?? ""),
      };

      let assignment;
      let assignmentId = await lookupAssignmentIdForSketch(order._id, assignedCadUser);
      if (assignmentId) {
        assignment = await updateAssignment(assignmentId, payload);
      } else {
        try {
          assignment = await createAssignment(payload);
        } catch (err) {
          assignmentId = await lookupAssignmentIdForSketch(order._id, assignedCadUser);
          if (assignmentId) {
            assignment = await updateAssignment(assignmentId, payload);
          } else {
            throw err;
          }
        }
      }
      assignmentId = assignment?._id ?? assignment?.id ?? assignmentId;
      if (order._id && assignmentId) {
        cacheAssignmentIdForSketch(order._id, assignmentId);
      }
      message.success("Assignment saved successfully.");
      if (onSave) {
        onSave({
          ...order,
          assignment,
          assignmentId: assignmentId ? String(assignmentId) : undefined,
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
  const canPullback = canManagePullback && canPullbackSketchEntity(order);

  return (
    <>
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
        !readOnly && (onSave || canPullback) ? (
          <Space wrap>
            {canPullback ? (
              <Button onClick={handlePullbackOpen}>Pull back &amp; reassign</Button>
            ) : null}
            {onSave ? (
              <>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" onClick={handleSave} loading={saveLoading}>
                  Save Changes
                </Button>
              </>
            ) : null}
          </Space>
        ) : null
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
            {isSingleUploadMode ? (
              /* Single Upload Mode */
              <div className="space-y-4">
                <Card size="small" className="border-line" style={{ marginBottom: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color="blue">Single Upload</Tag>
                  </div>
                  <div className="space-y-3">
                    <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                      Document types:{" "}
                      {Object.keys(SINGLE_MODE_DOCUMENT_LABELS)
                        .filter((key) => order[key] === true)
                        .map((key) => SINGLE_MODE_DOCUMENT_LABELS[key].en)
                        .join(", ") || "-"}
                    </Text>
                    {singleUploadFiles.length > 0 ? (
                      singleUploadFiles.map((file, index) => (
                        <div key={file.url || index} className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <Text strong className="text-sm block">
                              {file.fileName || `Document ${index + 1}`}
                            </Text>
                            <Text type="secondary" className="text-xs block">
                              Type: {file.mimeType || "Unknown"} • Size: {formatFileSize(file.size)}
                            </Text>
                            {file.uploadedAt && (
                              <Text type="secondary" className="text-xs block">
                                Uploaded: {formatDate(file.uploadedAt)}
                              </Text>
                            )}
                          </div>
                          <FileViewDownloadButtons
                            url={file.url}
                            fileName={file.fileName || `document-${index + 1}`}
                            downloadKey={file.url}
                            downloadingByKey={downloadingByKey}
                            setDownloadingByKey={setDownloadingByKey}
                          />
                        </div>
                      ))
                    ) : (
                      <Text type="secondary" className="text-xs">
                        No document
                      </Text>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              /* Normal Upload Mode */
              <div className="space-y-4">
                {Object.keys(DOCUMENT_LABELS).map((fieldName) => {
                  const files = normalizeFileList(order.documents?.[fieldName]);
                  const label = DOCUMENT_LABELS[fieldName];

                  return (
                    <Card
                      key={fieldName}
                      size="small"
                      className="border-line"
                      style={{ marginBottom: 8 }}
                    >
                      <Text strong className="text-sm block" style={{ marginBottom: 8 }}>
                        {label.en} / {label.kn}
                      </Text>
                      {files.length > 0 ? (
                        <div className="space-y-3">
                          {files.map((doc, index) => (
                            <div key={doc.url || index} className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <Text type="secondary" className="text-xs block">
                                  File: {doc.fileName || `Document ${index + 1}`}
                                </Text>
                                <Text type="secondary" className="text-xs block">
                                  Type: {doc.mimeType || "Unknown"} • Size: {formatFileSize(doc.size)}
                                </Text>
                                {doc.uploadedAt && (
                                  <Text type="secondary" className="text-xs block">
                                    Uploaded: {formatDate(doc.uploadedAt)}
                                  </Text>
                                )}
                              </div>
                              <FileViewDownloadButtons
                                url={doc.url}
                                fileName={doc.fileName || `${fieldName}-${index + 1}`}
                                downloadKey={doc.url}
                                downloadingByKey={downloadingByKey}
                                setDownloadingByKey={setDownloadingByKey}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary" className="text-xs">
                          Not uploaded
                        </Text>
                      )}
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
                              <FileViewDownloadButtons
                                key="actions"
                                url={doc.url}
                                fileName={doc.fileName || `other-document-${index + 1}`}
                                downloadKey={doc.url}
                                downloadingByKey={downloadingByKey}
                                setDownloadingByKey={setDownloadingByKey}
                              />,
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

          {/* CAD Deliverables */}
          {cadDeliverableFiles.length > 0 && (
            <>
              <Divider style={{ margin: "8px 0" }} />
              <Card size="small" title="CAD Deliverables" style={{ marginBottom: 0 }}>
                <List
                  size="small"
                  dataSource={cadDeliverableFiles}
                  renderItem={(file, index) => (
                    <List.Item
                      key={file.url || index}
                      actions={[
                        <FileViewDownloadButtons
                          key="actions"
                          url={file.url}
                          fileName={file.fileName || `cad-deliverable-${index + 1}`}
                          downloadKey={file.url}
                          downloadingByKey={downloadingByKey}
                          setDownloadingByKey={setDownloadingByKey}
                        />,
                      ]}
                    >
                      <div>
                        <Text strong className="text-sm">
                          {file.fileName || `CAD Deliverable ${index + 1}`}
                        </Text>
                        <div>
                          <Text type="secondary" className="text-xs">
                            Type: {file.mimeType || "Unknown"} • Size: {formatFileSize(file.size)}
                            {file.uploadedAt ? ` • Uploaded: ${formatDate(file.uploadedAt)}` : ""}
                          </Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </>
          )}

          {/* Audio Section */}
          <Divider style={{ margin: "8px 0" }} />
          <Card size="small" title="Audio / ಆಡಿಯೋ" style={{ marginBottom: 0 }}>
            {audioFile ? (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <SoundOutlined style={{ color: "var(--text-secondary)" }} />
                    <Text strong className="text-sm">
                      {audioFile.fileName || "Audio file"}
                    </Text>
                  </div>
                  <div className="space-y-1">
                    <Text type="secondary" className="text-xs block">
                      Type: {audioFile.mimeType || "–"} • Size:{" "}
                      {formatFileSize(audioFile.size)}
                    </Text>
                    {audioFile.uploadedAt && (
                      <Text type="secondary" className="text-xs block">
                        Uploaded: {formatDate(audioFile.uploadedAt)}
                      </Text>
                    )}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <audio
                      controls
                      src={audioFile.url}
                      style={{ width: "100%", maxWidth: 400, height: 36 }}
                      preload="metadata"
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </div>
                <FileViewDownloadButtons
                  url={audioFile.url}
                  fileName={audioFile.fileName || "audio"}
                  viewLabel="Open"
                  downloadKey={audioFile.url}
                  downloadingByKey={downloadingByKey}
                  setDownloadingByKey={setDownloadingByKey}
                />
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
              {/* <div>
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
              </div> */}
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
              {canPullback ? (
                <div>
                  <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                    Remove this job from the current CAD user and assign it to someone else.
                  </Text>
                  <Button onClick={handlePullbackOpen}>Pull back &amp; reassign</Button>
                </div>
              ) : null}
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

          <CadWalletPayoutSection
            order={order}
            readOnly={readOnly}
            canManage={canManageCadWallet}
            onRefresh={onOrderRefresh}
            cardTitle="CAD wallet & payouts"
          />
        </Space>
      ) : (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Text type="secondary">No order details available</Text>
        </div>
      )}
    </Drawer>

    <PullbackReassignModal
      open={pullbackOpen}
      loading={pullbackResolving || pullbackSubmitting}
      sketch={pullbackSketch}
      cadUsers={cadUsers}
      errorText={pullbackError}
      onClose={closePullback}
      onSubmit={handlePullbackSubmit}
    />
    </>
  );
};

export default ProjectOrderDetailDrawer;
export { PAYMENT_STATUS_MAP, STATUS_OPTIONS };
