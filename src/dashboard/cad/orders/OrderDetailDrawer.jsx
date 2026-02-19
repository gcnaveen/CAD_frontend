import React, { useState, useEffect } from "react";
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
} from "antd";
import { FileOutlined, UploadOutlined, LinkOutlined, SoundOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
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

const STATUS_TAG = {
  approved: { color: "green", text: "Approved" },
  rejected: { color: "red", text: "Rejected" },
  need_changes: { color: "orange", text: "Need Changes" },
  pending: { color: "blue", text: "Pending" },
};

const OrderDetailDrawer = ({
  open,
  onClose,
  order,
  onUploadCad,
  onSave,
}) => {
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (!open) setFileList([]);
  }, [open]);

  if (!order) return null;

  const statusConfig = STATUS_TAG[order.status] || STATUS_TAG.pending;
  const showNote = order.status === "need_changes" && order.note;

  const uploadProps = {
    name: "cadFile",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      setFileList((prev) => [...prev, file]);
      return false; // prevent auto upload
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

  return (
    <Drawer
      title={`Order ${order.orderId} - Details`}
      placement="right"
      width="80%"
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
        {/* Order info */}
        <Card size="small" title="Order Information">
          <Space wrap>
            <Text strong>Order ID:</Text>
            <Text>{order.orderId}</Text>
            <Text strong>Date:</Text>
            <Text>{order.orderDate}</Text>
            <Text strong>Customer:</Text>
            <Text>{order.customerName}</Text>
            <Text strong>Phone:</Text>
            <Text>{order.phoneNumber}</Text>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
          </Space>
        </Card>

        {/* Status & Note (when need changes) */}
        {showNote && (
          <Card size="small" title="Status & Note">
            <Alert
              type="warning"
              showIcon
              message="Changes required"
              description={order.note}
              style={{ marginBottom: 0 }}
            />
          </Card>
        )}

        <Divider style={{ margin: "8px 0" }} />

        {/* Sketch details & uploaded files */}
        <Card size="small" title="Sketch Details">
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            {order.sketchDetails?.description ||
              "Survey sketch and site plan for this order."}
          </Text>
          <Title level={5} style={{ marginTop: 12, marginBottom: 8 }}>
            Uploaded Sketch Files
          </Title>
          <List
            size="small"
            dataSource={order.sketchDetails?.uploadedFiles || []}
            renderItem={(file) => (
              <List.Item>
                <Space>
                  <FileOutlined />
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.name}
                  </a>
                  <LinkOutlined style={{ color: "#999" }} />
                </Space>
              </List.Item>
            )}
          />
          {(!order.sketchDetails?.uploadedFiles?.length) && (
            <Text type="secondary">No sketch files</Text>
          )}
        </Card>

        {/* Audio (survey audio when present) */}
        <Divider style={{ margin: "8px 0" }} />
        <Card size="small" title="Audio / ಆಡಿಯೋ">
          {order.audio?.url ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <SoundOutlined style={{ color: "#8c8c8c" }} />
                  <Text strong className="text-sm">
                    {order.audio.fileName || "Audio file"}
                  </Text>
                </div>
                <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                  Type: {order.audio.mimeType || "–"} • Size: {formatFileSize(order.audio.size)}
                </Text>
                {order.audio.uploadedAt && (
                  <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                    Uploaded: {formatDate(order.audio.uploadedAt)}
                  </Text>
                )}
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

        {/* CAD files (existing) */}
        <Card size="small" title="CAD Files">
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
                </Space>
              </List.Item>
            )}
          />
          {(!order.cadFiles?.length) && (
            <Text type="secondary">No CAD files uploaded yet</Text>
          )}
        </Card>

        <Divider style={{ margin: "8px 0" }} />

        {/* Upload CAD file */}
        <Card size="small" title="Upload CAD File">
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            Upload completed CAD drawing files for this order.
          </Text>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>Select CAD file(s)</Button>
          </Upload>
          {fileList.length > 0 && (
            <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
              {fileList.length} file(s) selected. Click "Upload CAD File(s)" in
              the drawer header to submit.
            </Text>
          )}
        </Card>
      </Space>
    </Drawer>
  );
};

export default OrderDetailDrawer;
