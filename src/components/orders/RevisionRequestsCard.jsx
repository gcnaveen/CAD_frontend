import React from "react";
import { Alert, Card, Divider, List, Space, Tag, Typography } from "antd";
import { SoundOutlined } from "@ant-design/icons";
import { normalizeSingleFile } from "../../utils/sketchFileUtils";

const { Text } = Typography;

const DEFAULT_LABELS = {
  title: "Revision requests",
  empty: "No revision requests yet.",
  revisionNo: "Revision",
  remarks: "Remarks",
  requestedAt: "Requested at",
  resolvedAt: "Resolved at",
  noRemarks: "No remarks provided.",
  audio: "Revision audio",
  openActive: "Open revision request — review remarks and audio, then upload an updated CAD deliverable.",
};

const STATUS_TAG = {
  REQUESTED: { color: "orange", text: "Requested" },
  PENDING: { color: "gold", text: "Pending" },
  IN_PROGRESS: { color: "blue", text: "In progress" },
  RESOLVED: { color: "green", text: "Resolved" },
  COMPLETED: { color: "green", text: "Completed" },
  PAID: { color: "cyan", text: "Paid" },
  CANCELLED: { color: "default", text: "Cancelled" },
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

/**
 * Renders surveyor CAD revision requests (remarks + audio) for order detail drawers.
 * @param {object[]} revisionRequests
 * @param {Partial<typeof DEFAULT_LABELS>} [labels]
 * @param {boolean} [showEmpty=false]
 * @param {string} [cardSize="small"]
 */
const RevisionRequestsCard = ({
  revisionRequests,
  labels: labelsProp,
  showEmpty = false,
  cardSize = "small",
  style,
}) => {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const requests = Array.isArray(revisionRequests)
    ? [...revisionRequests].sort((a, b) => {
        const aNo = Number(a?.revisionNo) || 0;
        const bNo = Number(b?.revisionNo) || 0;
        if (bNo !== aNo) return bNo - aNo;
        const aTime = new Date(a?.requestedAt || 0).getTime();
        const bTime = new Date(b?.requestedAt || 0).getTime();
        return bTime - aTime;
      })
    : [];

  if (!requests.length && !showEmpty) return null;

  const hasOpenRequest = requests.some((r) => {
    const st = String(r?.status || "").toUpperCase();
    return st === "REQUESTED" || st === "PENDING" || st === "IN_PROGRESS";
  });

  return (
    <Card size={cardSize} title={labels.title} style={style}>
      {hasOpenRequest && (
        <Alert
          type="warning"
          showIcon
          message={labels.openActive}
          style={{ marginBottom: 12 }}
        />
      )}
      {requests.length === 0 ? (
        <Text type="secondary">{labels.empty}</Text>
      ) : (
        <List
          size="small"
          dataSource={requests}
          renderItem={(item, index) => {
            const statusKey = String(item?.status || "").toUpperCase();
            const statusMeta = STATUS_TAG[statusKey] || {
              color: "default",
              text: item?.status || "—",
            };
            const audio = normalizeSingleFile(item?.audio);
            const remarks = String(item?.remarks || "").trim();
            const revisionNo = item?.revisionNo ?? requests.length - index;

            return (
              <List.Item key={`${revisionNo}-${item?.requestedAt || index}`}>
                <div style={{ width: "100%" }}>
                  <Space wrap style={{ marginBottom: 8 }}>
                    <Text strong>
                      {labels.revisionNo} #{revisionNo}
                    </Text>
                    <Tag color={statusMeta.color}>{statusMeta.text}</Tag>
                  </Space>

                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                      {labels.remarks}
                    </Text>
                    <Text className="text-sm">{remarks || labels.noRemarks}</Text>
                  </div>

                  <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                    {labels.requestedAt}: {formatDate(item?.requestedAt)}
                  </Text>
                  {item?.resolvedAt && (
                    <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                      {labels.resolvedAt}: {formatDate(item.resolvedAt)}
                    </Text>
                  )}

                  {audio?.url && (
                    <>
                      <Divider style={{ margin: "12px 0" }} />
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <SoundOutlined style={{ color: "var(--text-secondary)" }} />
                            <Text strong className="text-sm">
                              {audio.fileName || labels.audio}
                            </Text>
                          </div>
                          <Text type="secondary" className="text-xs" style={{ display: "block" }}>
                            {audio.mimeType || "—"}
                            {audio.size != null ? ` • ${formatFileSize(audio.size)}` : ""}
                            {audio.uploadedAt ? ` • ${formatDate(audio.uploadedAt)}` : ""}
                          </Text>
                          <div style={{ marginTop: 12 }}>
                            <audio
                              controls
                              src={audio.url}
                              style={{ width: "100%", maxWidth: 400, height: 36 }}
                              preload="metadata"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default RevisionRequestsCard;
