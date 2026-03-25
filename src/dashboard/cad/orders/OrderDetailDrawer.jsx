import React, { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  Typography,
  Space,
  Divider,
  Card,
  List,
  Button,
  Upload,
  Tag,
  Alert,
  message,
  Descriptions,
} from "antd";
import {
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  LinkOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { formatUserDisplayLabel } from "../../../services/assignmentApi";

const { Text } = Typography;

const ASSIGNMENT_STATUS_TAG = {
  ASSIGNED: { color: "blue", text: "Assigned" },
  IN_PROGRESS: { color: "orange", text: "In Progress" },
  COMPLETED: { color: "green", text: "Completed" },
  ON_HOLD: { color: "gold", text: "On Hold" },
  CANCELLED: { color: "red", text: "Cancelled" },
  PENDING: { color: "default", text: "Pending" },
};

const SKETCH_STATUS_DISPLAY = {
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

const DOCUMENT_LABELS = {
  moolaTippani: { en: "Moola Tippani" },
  hissaTippani: { en: "Hissa Tippani" },
  atlas: { en: "Atlas" },
  rrPakkabook: { en: "RR Pakkabook" },
  kharabu: { en: "Kharabu" },
};

const SINGLE_MODE_DOCUMENT_LABELS = {
  is_originaltippani: { en: "Moola Tippani" },
  is_hissatippani: { en: "Hissa Tippani" },
  is_atlas: { en: "Atlas" },
  is_rrpakkabook: { en: "RR Pakkabook" },
  is_akarabandu: { en: "Akarabandu" },
  is_kharabuttar: { en: "Kharab Utthar" },
  is_mulapatra: { en: "Moola Patra" },
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
};

const formatLocationDisplay = (location) => {
  if (!location) return "—";
  if (typeof location === "string") return location;
  const name = location.name || "";
  const code = location.code ? ` (${location.code})` : "";
  const line = `${name}${code}`.trim();
  return line || location._id || "—";
};

const formatSurveyType = (type) => {
  if (!type) return "—";
  if (type === "joint_flat") return "Joint Flat";
  if (type === "single_flat") return "Single Flat";
  return String(type);
};

const OrderDetailDrawer = ({
  open,
  onClose,
  order,
  onUploadCad,
  onSave,
}) => {
  const [fileList, setFileList] = useState([]);
  const [downloadingByKey, setDownloadingByKey] = useState({});

  useEffect(() => {
    if (!open) setFileList([]);
  }, [open]);

  const sketch = order?.sketchUpload || {};

  const singleModeSelectedLabels = useMemo(
    () =>
      Object.keys(SINGLE_MODE_DOCUMENT_LABELS)
        .filter((key) => sketch[key] === true)
        .map((key) => SINGLE_MODE_DOCUMENT_LABELS[key].en),
    [sketch]
  );

  const normalDocumentItems = useMemo(() => {
    const docs = sketch.documents;
    if (!docs || typeof docs !== "object") return [];
    return Object.keys(DOCUMENT_LABELS)
      .map((key) => {
        const doc = docs[key];
        const label = DOCUMENT_LABELS[key]?.en || key;
        return doc?.url ? { key, label, doc } : null;
      })
      .filter(Boolean);
  }, [sketch.documents]);

  if (!order) return null;

  const assignmentStatus = String(order.status || "").toUpperCase();
  const assignmentTag =
    ASSIGNMENT_STATUS_TAG[assignmentStatus] || ASSIGNMENT_STATUS_TAG.PENDING;
  const sketchStatus = sketch.status ? String(sketch.status).toUpperCase() : "";
  const sketchStatusText =
    SKETCH_STATUS_DISPLAY[sketchStatus] || sketch.status || "—";

  const showAssignmentNote = assignmentStatus === "NEED_CHANGES" && order.note;
  const sketchStatusNoteText = sketch.statusNote ?? order.sketchStatusNote;
  const showSketchStatusNote = Boolean(sketchStatusNoteText);

  const uploadProps = {
    name: "cadFile",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      setFileList((prev) => [...prev, file]);
      return false;
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  const handleUploadSubmit = () => {
    if (fileList.length === 0) {
      message.warning("Please select at least one file to upload.");
      return;
    }
    onUploadCad?.(order.id, fileList);
    setFileList([]);
    message.success("CAD file(s) uploaded successfully.");
    onClose?.();
  };

  const handleDownload = async (url, fileName, key = url) => {
    if (!url) return;
    try {
      setDownloadingByKey((p) => ({ ...p, [key]: true }));
      // Fetch as blob and trigger download via object URL so the SPA doesn't navigate away.
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      message.error(
        "Download failed. If the file is hosted on a different domain, your browser may block direct download."
      );
    } finally {
      setDownloadingByKey((p) => ({ ...p, [key]: false }));
    }
  };

  const filesList = order.sketchDetails?.uploadedFiles || [];
  const isSingleMode = order.sketchDetails?.isSingleMode || Boolean(sketch.singleUpload?.url);

  return (
    <Drawer
      title={
        <span>
          Application{" "}
          <Text strong>{order.orderId || order.applicationId || "—"}</Text>
        </span>
      }
      placement="right"
      width="min(100vw, 900px)"
      onClose={onClose}
      open={open}
      destroyOnClose
      extra={
        onSave && (
          <Space>
            <Button onClick={onClose}>Close</Button>
            {fileList.length > 0 && (
              <Button type="primary" onClick={handleUploadSubmit}>
                Upload CAD File(s)
              </Button>
            )}
          </Space>
        )
      }
      styles={{ body: { paddingBottom: 24 } }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card size="small" title="Assignment">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Application ID">
              <Text strong>{order.applicationId || order.orderId || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Survey No">
              {order.surveyNo || sketch.surveyNo || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Assigned at">
              {formatDate(order.orderDate)}
            </Descriptions.Item>
            <Descriptions.Item label="Due date">
              {order.dueDate ? formatDate(order.dueDate) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Assignment status">
              <Tag color={assignmentTag.color}>{assignmentTag.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Assignment notes">
              {order.note || "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card size="small" title="Survey sketch">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Survey type">
              <Tag>{formatSurveyType(sketch.surveyType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="District">
              {formatLocationDisplay(sketch.district)}
            </Descriptions.Item>
            <Descriptions.Item label="Taluka">
              {formatLocationDisplay(sketch.taluka)}
            </Descriptions.Item>
            <Descriptions.Item label="Hobli">
              {formatLocationDisplay(sketch.hobli)}
            </Descriptions.Item>
            <Descriptions.Item label="Village">
              {formatLocationDisplay(sketch.village)}
            </Descriptions.Item>
            <Descriptions.Item label="Upload status">
              <Tag>{sketchStatusText}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Others / notes">
              {sketch.others ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(sketch.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {formatDate(sketch.updatedAt)}
            </Descriptions.Item>
            {sketch.reviewedAt != null && (
              <Descriptions.Item label="Reviewed at">
                {formatDate(sketch.reviewedAt)}
              </Descriptions.Item>
            )}
            {sketch.reviewedBy != null && (
              <Descriptions.Item label="Reviewed by">
                {typeof sketch.reviewedBy === "object"
                  ? formatUserDisplayLabel(sketch.reviewedBy) || "—"
                  : String(sketch.reviewedBy)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {sketch.surveyor && (
          <Card size="small" title="Surveyor">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Name">
                {formatUserDisplayLabel(sketch.surveyor) || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {sketch.surveyor?.auth?.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {sketch.surveyor?.auth?.email || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {showAssignmentNote && (
          <Card size="small" title="Assignment">
            <Alert
              type="warning"
              showIcon
              message="Changes required"
              description={order.note}
              style={{ marginBottom: 0 }}
            />
          </Card>
        )}

        {showSketchStatusNote && (
          <Card size="small" title="Review note">
            <Alert
              type="info"
              showIcon
              message="Status note"
              description={sketchStatusNoteText}
              style={{ marginBottom: 0 }}
            />
          </Card>
        )}

        <Divider style={{ margin: "8px 0" }} />

        <Card
          size="small"
          title={
            <Space>
              <span>Uploaded documents</span>
              {isSingleMode ? <Tag color="blue">Single upload</Tag> : <Tag>Per document</Tag>}
            </Space>
          }
        >
          {isSingleMode && sketch.singleUpload?.url ? (
            <div className="space-y-3">
              <div>
                <Text type="secondary" className="text-xs block" style={{ marginBottom: 8 }}>
                  Document types marked on upload
                </Text>
                <Text className="text-sm">
                  {singleModeSelectedLabels.length
                    ? singleModeSelectedLabels.join(", ")
                    : "—"}
                </Text>
              </div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Text strong className="text-sm block">
                    {sketch.singleUpload.fileName || "Document"}
                  </Text>
                  <Text type="secondary" className="text-xs block">
                    {sketch.singleUpload.mimeType || "—"} •{" "}
                    {formatFileSize(sketch.singleUpload.size)}
                  </Text>
                  {sketch.singleUpload.uploadedAt && (
                    <Text type="secondary" className="text-xs block">
                      Uploaded: {formatDate(sketch.singleUpload.uploadedAt)}
                    </Text>
                  )}
                </div>
                  <Space>
                    <Button
                      type="link"
                      icon={<LinkOutlined />}
                      onClick={() => window.open(sketch.singleUpload.url, "_blank")}
                      size="small"
                    >
                      View
                    </Button>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      loading={!!downloadingByKey[sketch.singleUpload.url]}
                      onClick={() =>
                        handleDownload(
                          sketch.singleUpload.url,
                          sketch.singleUpload.fileName || "download",
                          sketch.singleUpload.url
                        )
                      }
                      size="small"
                    >
                      Download
                    </Button>
                  </Space>
              </div>
            </div>
          ) : normalDocumentItems.length > 0 ? (
            <List
              size="small"
              dataSource={normalDocumentItems}
              renderItem={({ label, doc }) => (
                <List.Item
                  actions={[
                    <Button
                      key="open"
                      type="link"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                        View
                      </Button>,
                      <Button
                        key="download"
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                            loading={!!downloadingByKey[doc.url]}
                            onClick={() =>
                              handleDownload(
                                doc.url,
                                doc.fileName || `${label}.pdf`,
                                doc.url
                              )
                            }
                      >
                        Download
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <FileOutlined />
                        <Text strong className="text-sm">{label}</Text>
                      </Space>
                    }
                    description={
                      <Text type="secondary" className="text-xs">
                        {doc.fileName || "—"} • {doc.mimeType || "—"} •{" "}
                        {formatFileSize(doc.size)}
                        {doc.uploadedAt ? ` • ${formatDate(doc.uploadedAt)}` : ""}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          ) : filesList.length > 0 ? (
            <List
              size="small"
              dataSource={filesList}
              renderItem={(file) => (
                <List.Item>
                  <Space direction="vertical" size={0} style={{ width: "100%" }}>
                    <Space>
                      <FileOutlined />
                      <Space size={8} align="center">
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.name}
                        </a>
                        <Button
                          type="link"
                          icon={<DownloadOutlined />}
                          loading={!!downloadingByKey[file.url]}
                          onClick={() => handleDownload(file.url, file.name || "download", file.url)}
                          size="small"
                        >
                          Download
                        </Button>
                      </Space>
                    </Space>
                    {(file.mimeType || file.size) && (
                      <Text type="secondary" className="text-xs">
                        {file.mimeType || "—"} • {formatFileSize(file.size)}
                        {file.uploadedAt ? ` • ${formatDate(file.uploadedAt)}` : ""}
                      </Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Text type="secondary">No sketch files</Text>
          )}
        </Card>

        {Array.isArray(sketch.other_documents) && sketch.other_documents.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <Card size="small" title="Other documents">
              <List
                size="small"
                dataSource={sketch.other_documents}
                renderItem={(doc, index) => (
                  <List.Item
                    key={doc.url || index}
                    actions={
                      doc.url
                        ? [
                            <Button
                              key="v"
                              type="link"
                              size="small"
                              icon={<LinkOutlined />}
                              onClick={() => window.open(doc.url, "_blank")}
                            >
                              Open
                            </Button>,
                            <Button
                              key="d"
                              type="link"
                              size="small"
                              icon={<DownloadOutlined />}
                              loading={!!downloadingByKey[doc.url]}
                              onClick={() =>
                                handleDownload(
                                  doc.url,
                                  doc.fileName || `document-${index + 1}`,
                                  doc.url
                                )
                              }
                            >
                              Download
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
                          {doc.mimeType || ""}
                          {doc.size != null ? ` • ${formatFileSize(doc.size)}` : ""}
                          {doc.uploadedAt ? ` • ${formatDate(doc.uploadedAt)}` : ""}
                        </Text>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </>
        )}

        <Divider style={{ margin: "8px 0" }} />
        <Card size="small" title="Audio / ಆಡಿಯೋ">
          {order.audio?.url || sketch.audio?.url ? (
            (() => {
              const audio = order.audio?.url ? order.audio : sketch.audio;
              return (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <SoundOutlined style={{ color: "#8c8c8c" }} />
                      <Text strong className="text-sm">
                        {audio.fileName || "Audio file"}
                      </Text>
                    </div>
                    <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                      Type: {audio.mimeType || "–"} • Size: {formatFileSize(audio.size)}
                    </Text>
                    {audio.uploadedAt && (
                      <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                        Uploaded: {formatDate(audio.uploadedAt)}
                      </Text>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <audio
                        controls
                        src={audio.url}
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
                    onClick={() => window.open(audio.url, "_blank")}
                    size="small"
                  >
                    Open
                  </Button>
                </div>
              );
            })()
          ) : (
            <Text type="secondary" className="text-sm">
              No audio uploaded
            </Text>
          )}
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        <Card size="small" title="CAD deliverables">
          <List
            size="small"
            dataSource={order.cadFiles || []}
            renderItem={(file) => (
              <List.Item>
                <Space>
                  <FileOutlined />
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                  <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    loading={!!downloadingByKey[file.url]}
                    onClick={() => handleDownload(file.url, file.name || "cad-deliverable", file.url)}
                    size="small"
                  >
                    Download
                  </Button>
                </Space>
              </List.Item>
            )}
          />
          {(!order.cadFiles?.length) && (
            <Text type="secondary">No CAD files uploaded yet</Text>
          )}
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        <Card size="small" title="Upload CAD file">
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Upload completed CAD drawing files for this application.
          </Text>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select CAD file(s)</Button>
          </Upload>
          {fileList.length > 0 && (
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {fileList.length} file(s) selected. Use &quot;Upload CAD File(s)&quot; in the
              header to submit.
            </Text>
          )}
        </Card>
      </Space>
    </Drawer>
  );
};

export default OrderDetailDrawer;
