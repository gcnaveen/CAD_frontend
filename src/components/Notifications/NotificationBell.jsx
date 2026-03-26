import React, { useCallback, useState } from "react";
import { Badge, Button, App, Modal } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications.js";
import NotificationList from "./NotificationList.jsx";
import { resolveNotificationPath } from "./resolveNotificationPath.js";

export default function NotificationBell({ layout = "user" }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const onError = useCallback(
    (msg) => {
      message.error(msg);
    },
    [message],
  );

  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ enabled: true, page: 1, limit: 20, onError });

  const handleOpenChange = useCallback((next) => {
    setOpen(next);
  }, []);

  const handleMarkAsRead = useCallback(
    async (id) => {
      setMarkingId(id);
      try {
        await markAsRead(id);
      } catch {
        // toast from hook onError
      } finally {
        setMarkingId(null);
      }
    },
    [markAsRead],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } catch {
      // toast from hook onError
    } finally {
      setMarkingAll(false);
    }
  }, [markAllAsRead]);

  const handleItemActivate = useCallback(
    async (item) => {
      if (!item.isRead) {
        try {
          await markAsRead(item.id);
        } catch {
          return;
        }
      }
      const path = resolveNotificationPath(layout, item.entityType);
      if (path) {
        setOpen(false);
        navigate(path);
      }
    },
    [layout, markAsRead, navigate],
  );

  const modalContent = useCallback(
    () => (
      <NotificationList
        notifications={notifications}
        loading={loading}
        error={error}
        onItemActivate={handleItemActivate}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        markingId={markingId}
        markingAll={markingAll}
        layout={layout === "user" ? "user" : "antd"}
        inModal
      />
    ),
    [
      notifications,
      loading,
      error,
      handleItemActivate,
      handleMarkAsRead,
      handleMarkAllAsRead,
      markingId,
      markingAll,
      layout,
    ],
  );

  const isUserLayout = layout === "user";

  const trigger = isUserLayout ? (
    <button
      type="button"
      aria-label="Notifications"
      className="theme-animate-surface inline-flex items-center justify-center w-10 h-10 rounded-xl border border-line bg-surface text-fg hover:bg-surface-2 transition-colors shadow-sm"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, color: "var(--user-accent)" }} />
      </Badge>
    </button>
  ) : (
    <Badge count={unreadCount} size="small" offset={[-4, 4]}>
      <Button
        type="text"
        icon={<BellOutlined style={{ fontSize: 18 }} />}
        aria-label="Notifications"
        className="cad-notif-bell"
        style={{ color: "var(--text-secondary)" }}
      />
    </Badge>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => handleOpenChange(true)}
        aria-label="Open notifications"
        className="bg-transparent border-0 p-0 m-0 inline-flex"
      >
        {trigger}
      </button>

      <Modal
        open={open}
        onCancel={() => handleOpenChange(false)}
        footer={null}
        centered
        title={null}
        closeIcon={null}
        width="min(96vw, 480px)"
        maskClosable
        destroyOnClose
        styles={{
          mask: {
            background: "var(--mask-backdrop)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          },
          content: {
            padding: 0,
            borderRadius: 20,
            overflow: "hidden",
            background: "transparent",
            boxShadow:
              "0 24px 60px var(--homepage-card-shadow), 0 0 1px color-mix(in srgb, var(--text-primary) 14%, transparent)",
          },
          body: {
            padding: 0,
          },
        }}
      >
        {modalContent()}
      </Modal>
    </>
  );
}
