import React, { useCallback, useMemo } from "react";
import {
  Button,
  Empty,
  Spin,
  Typography,
  Alert,
  Divider,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { formatRelativeTime } from "./formatRelativeTime.js";

const { Text, Title } = Typography;

const LIST_MAX_HEIGHT = 320;
const VISIBLE_CAP = 8;

function NotificationRow({
  item,
  onRowClick,
  onMarkOne,
  markingId,
}) {
  const unread = !item.isRead;
  const timeLabel = formatRelativeTime(item.createdAt);

  const handleMarkReadClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!unread) return;
      onMarkOne(item.id);
    },
    [unread, item.id, onMarkOne],
  );

  return (
    <button
      type="button"
      onClick={() => onRowClick(item)}
      className="cad-notif-row"
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        margin: 0,
        border: "none",
        borderBottom: "1px solid #f1f5f9",
        background: unread ? "rgba(14, 165, 233, 0.06)" : "transparent",
        cursor: "pointer",
        borderRadius: 0,
        transition: "background 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unread && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#0ea5e9",
                  flexShrink: 0,
                  marginTop: 5,
                }}
                aria-hidden
              />
            )}
            <Title
              level={5}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
                lineHeight: 1.35,
              }}
            >
              {item.title}
            </Title>
          </div>
          {item.message ? (
            <Text
              type="secondary"
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 12,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {item.message}
            </Text>
          ) : null}
          {timeLabel ? (
            <Text
              type="secondary"
              style={{ fontSize: 11, marginTop: 6, display: "block" }}
            >
              {timeLabel}
            </Text>
          ) : null}
        </div>
        {unread ? (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            loading={markingId === item.id}
            onClick={handleMarkReadClick}
            style={{ flexShrink: 0, padding: "0 4px", height: "auto" }}
          >
            Read
          </Button>
        ) : null}
      </div>
    </button>
  );
}

export default function NotificationList({
  notifications,
  loading,
  error,
  onItemActivate,
  onMarkAsRead,
  onMarkAllAsRead,
  markingId,
  markingAll,
  layout = "antd",
}) {
  const slice = useMemo(
    () => notifications.slice(0, VISIBLE_CAP),
    [notifications],
  );

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.isRead),
    [notifications],
  );

  const handleMarkAll = useCallback(() => {
    if (!hasUnread) return;
    onMarkAllAsRead();
  }, [hasUnread, onMarkAllAsRead]);

  const panelStyle =
    layout === "user"
      ? {
          width: "min(calc(100vw - 24px), 380px)",
          maxWidth: "min(calc(100vw - 24px), 380px)",
        }
      : {
          width: 360,
          maxWidth: "min(calc(100vw - 32px), 360px)",
        };

  return (
    <div
      className="notification-dropdown-panel"
      style={{
        ...panelStyle,
        background: "#fff",
        borderRadius: 12,
        boxShadow:
          "0 10px 40px rgba(15, 23, 42, 0.12), 0 0 1px rgba(15, 23, 42, 0.08)",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Title level={5} style={{ margin: 0, fontSize: 14 }}>
          Notifications
        </Title>
        <Button
          type="link"
          size="small"
          disabled={!hasUnread || markingAll}
          loading={markingAll}
          onClick={handleMarkAll}
          style={{ padding: 0, height: "auto" }}
        >
          Mark all read
        </Button>
      </div>

      {error ? (
        <div style={{ padding: 12 }}>
          <Alert type="error" message={error} showIcon />
        </div>
      ) : null}

      <div
        style={{
          maxHeight: LIST_MAX_HEIGHT,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {loading && notifications.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <Spin />
          </div>
        ) : null}

        {!loading && notifications.length === 0 && !error ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ padding: "24px 16px" }}
          />
        ) : null}

        {slice.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            onRowClick={onItemActivate}
            onMarkOne={onMarkAsRead}
            markingId={markingId}
          />
        ))}
      </div>

      {notifications.length > VISIBLE_CAP ? (
        <>
          <Divider style={{ margin: 0 }} />
          <Text
            type="secondary"
            style={{
              display: "block",
              textAlign: "center",
              fontSize: 11,
              padding: "8px 12px",
            }}
          >
            Showing {VISIBLE_CAP} of {notifications.length}
          </Text>
        </>
      ) : null}
    </div>
  );
}
