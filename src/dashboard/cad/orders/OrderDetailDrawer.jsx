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
import { cadBi, cadBiFmt } from "../cadBilingual";

const { Text } = Typography;

const ASSIGNMENT_STATUS_TAG = {
  ASSIGNED: { color: "blue", text: cadBi.orders.assignmentStatus.ASSIGNED },
  IN_PROGRESS: { color: "orange", text: cadBi.orders.assignmentStatus.IN_PROGRESS },
  COMPLETED: { color: "green", text: cadBi.orders.assignmentStatus.COMPLETED },
  ON_HOLD: { color: "gold", text: cadBi.orders.assignmentStatus.ON_HOLD },
  CANCELLED: { color: "red", text: cadBi.orders.assignmentStatus.CANCELLED },
  PENDING: { color: "default", text: cadBi.orders.assignmentStatus.PENDING },
  NEED_CHANGES: { color: "orange", text: cadBi.orders.assignmentStatus.NEED_CHANGES },
};

const SKETCH_STATUS_DISPLAY = {
  PENDING: cadBi.drawer.sketchStatus.PENDING,
  ASSIGNED: cadBi.drawer.sketchStatus.ASSIGNED,
  UNDER_REVIEW: cadBi.drawer.sketchStatus.UNDER_REVIEW,
  APPROVED: cadBi.drawer.sketchStatus.APPROVED,
  REJECTED: cadBi.drawer.sketchStatus.REJECTED,
  IN_PROGRESS: cadBi.drawer.sketchStatus.IN_PROGRESS,
  COMPLETED: cadBi.drawer.sketchStatus.COMPLETED,
  ON_HOLD: cadBi.drawer.sketchStatus.ON_HOLD,
  CANCELLED: cadBi.drawer.sketchStatus.CANCELLED,
};

const DOCUMENT_LABEL_KEYS = ["moolaTippani", "hissaTippani", "atlas", "rrPakkabook", "kharabu"];

const SINGLE_MODE_DOCUMENT_KEYS = [
  "is_originaltippani",
  "is_hissatippani",
  "is_atlas",
  "is_rrpakkabook",
  "is_akarabandu",
  "is_kharabuttar",
  "is_mulapatra",
];

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
  if (type === "joint_flat") return cadBi.drawer.surveyTypes.joint_flat;
  if (type === "single_flat") return cadBi.drawer.surveyTypes.single_flat;
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
      SINGLE_MODE_DOCUMENT_KEYS.filter((key) => sketch[key] === true).map(
        (key) => cadBi.drawer.docLabels[key] || key
      ),
    [sketch]
  );

  const normalDocumentItems = useMemo(() => {
    const docs = sketch.documents;
    if (!docs || typeof docs !== "object") return [];
    return DOCUMENT_LABEL_KEYS.map((key) => {
      const doc = docs[key];
      const label = cadBi.drawer.docLabels[key] || key;
      return doc?.url ? { key, label, doc } : null;
    }).filter(Boolean);
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
      message.warning(cadBi.drawer.selectFileWarn);
      return;
    }
    onUploadCad?.(order.id, fileList);
    setFileList([]);
    message.success(cadBi.drawer.uploadSuccess);
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
      message.error(cadBi.drawer.downloadFail);
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
          {cadBi.drawer.application}{" "}
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
            <Button onClick={onClose}>{cadBi.drawer.close}</Button>
            {fileList.length > 0 && (
              <Button type="primary" onClick={handleUploadSubmit}>
                {cadBi.drawer.uploadCadFiles}
              </Button>
            )}
          </Space>
        )
      }
      styles={{ body: { paddingBottom: 24 } }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card size="small" title={cadBi.drawer.assignment}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={cadBi.drawer.applicationId}>
              <Text strong>{order.applicationId || order.orderId || "—"}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.surveyNo}>
              {order.surveyNo || sketch.surveyNo || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.assignedAt}>
              {formatDate(order.orderDate)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.dueDate}>
              {order.dueDate ? formatDate(order.dueDate) : "—"}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.assignmentStatus}>
              <Tag color={assignmentTag.color}>{assignmentTag.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.assignmentNotes}>
              {order.note || "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card size="small" title={cadBi.drawer.surveySketch}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={cadBi.drawer.surveyType}>
              <Tag>{formatSurveyType(sketch.surveyType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.district}>
              {formatLocationDisplay(sketch.district)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.taluka}>
              {formatLocationDisplay(sketch.taluka)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.hobli}>
              {formatLocationDisplay(sketch.hobli)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.village}>
              {formatLocationDisplay(sketch.village)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.uploadStatus}>
              <Tag>{sketchStatusText}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.othersNotes}>
              {sketch.others ?? "—"}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.created}>
              {formatDate(sketch.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label={cadBi.drawer.updated}>
              {formatDate(sketch.updatedAt)}
            </Descriptions.Item>
            {sketch.reviewedAt != null && (
              <Descriptions.Item label={cadBi.drawer.reviewedAt}>
                {formatDate(sketch.reviewedAt)}
              </Descriptions.Item>
            )}
            {sketch.reviewedBy != null && (
              <Descriptions.Item label={cadBi.drawer.reviewedBy}>
                {typeof sketch.reviewedBy === "object"
                  ? formatUserDisplayLabel(sketch.reviewedBy) || "—"
                  : String(sketch.reviewedBy)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {sketch.surveyor && (
          <Card size="small" title={cadBi.drawer.surveyor}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={cadBi.drawer.name}>
                {formatUserDisplayLabel(sketch.surveyor) || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={cadBi.drawer.phone}>
                {sketch.surveyor?.auth?.phone || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={cadBi.drawer.email}>
                {sketch.surveyor?.auth?.email || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {showAssignmentNote && (
          <Card size="small" title={cadBi.drawer.assignment}>
            <Alert
              type="warning"
              showIcon
              message={cadBi.drawer.changesRequired}
              description={order.note}
              style={{ marginBottom: 0 }}
            />
          </Card>
        )}

        {showSketchStatusNote && (
          <Card size="small" title={cadBi.drawer.reviewNote}>
            <Alert
              type="info"
              showIcon
              message={cadBi.drawer.statusNote}
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
              <span>{cadBi.drawer.uploadedDocuments}</span>
              {isSingleMode ? (
                <Tag color="blue">{cadBi.drawer.singleUpload}</Tag>
              ) : (
                <Tag>{cadBi.drawer.perDocument}</Tag>
              )}
            </Space>
          }
        >
          {isSingleMode && sketch.singleUpload?.url ? (
            <div className="space-y-3">
              <div>
                <Text type="secondary" className="text-xs block" style={{ marginBottom: 8 }}>
                  {cadBi.drawer.documentTypesMarked}
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
                      {cadBi.drawer.uploaded}: {formatDate(sketch.singleUpload.uploadedAt)}
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
                      {cadBi.drawer.view}
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
                      {cadBi.drawer.download}
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
                        {cadBi.drawer.view}
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
                        {cadBi.drawer.download}
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
                          {cadBi.drawer.download}
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
            <Text type="secondary">{cadBi.drawer.noSketchFiles}</Text>
          )}
        </Card>

        {Array.isArray(sketch.other_documents) && sketch.other_documents.length > 0 && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <Card size="small" title={cadBi.drawer.otherDocuments}>
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
                              {cadBi.drawer.open}
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
                              {cadBi.drawer.download}
                            </Button>,
                          ]
                        : []
                    }
                  >
                    <div>
                      <Text strong className="text-sm">
                        {doc.fileName || cadBi.drawer.documentFallback}
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
        <Card size="small" title={cadBi.drawer.audioCardTitle}>
          {order.audio?.url || sketch.audio?.url ? (
            (() => {
              const audio = order.audio?.url ? order.audio : sketch.audio;
              return (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <SoundOutlined style={{ color: "var(--text-secondary)" }} />
                      <Text strong className="text-sm">
                        {audio.fileName || cadBi.drawer.audioFile}
                      </Text>
                    </div>
                    <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                      {cadBiFmt(cadBi.drawer.typeSizeLine, {
                        mime: audio.mimeType || "–",
                        size: formatFileSize(audio.size),
                      })}
                    </Text>
                    {audio.uploadedAt && (
                      <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                        {cadBi.drawer.uploaded}: {formatDate(audio.uploadedAt)}
                      </Text>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <audio
                        controls
                        src={audio.url}
                        style={{ width: "100%", maxWidth: 400, height: 36 }}
                        preload="metadata"
                      >
                        {cadBi.drawer.audioUnsupported}
                      </audio>
                    </div>
                  </div>
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    onClick={() => window.open(audio.url, "_blank")}
                    size="small"
                  >
                    {cadBi.drawer.open}
                  </Button>
                </div>
              );
            })()
          ) : (
            <Text type="secondary" className="text-sm">
              {cadBi.drawer.noAudio}
            </Text>
          )}
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        <Card size="small" title={cadBi.drawer.cadDeliverables}>
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
                    {cadBi.drawer.download}
                  </Button>
                </Space>
              </List.Item>
            )}
          />
          {(!order.cadFiles?.length) && (
            <Text type="secondary">{cadBi.drawer.noCadYet}</Text>
          )}
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        <Card size="small" title={cadBi.drawer.uploadCadFile}>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            {cadBi.drawer.uploadCadHelp}
          </Text>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>{cadBi.drawer.selectCadFiles}</Button>
          </Upload>
          {fileList.length > 0 && (
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {cadBiFmt(cadBi.drawer.filesSelectedHint, { n: fileList.length })}
            </Text>
          )}
        </Card>
      </Space>
    </Drawer>
  );
};

export default OrderDetailDrawer;
