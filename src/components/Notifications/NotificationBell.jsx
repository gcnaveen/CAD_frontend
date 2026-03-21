import React, { useCallback, useState } from "react";
import { Dropdown, Badge, Button, App } from "antd";
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

  const dropdownRender = useCallback(
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
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-orange-100 bg-white text-slate-700 hover:bg-orange-50 transition-colors shadow-sm"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, color: "#ea580c" }} />
      </Badge>
    </button>
  ) : (
    <Badge count={unreadCount} size="small" offset={[-4, 4]}>
      <Button
        type="text"
        icon={<BellOutlined style={{ fontSize: 18 }} />}
        aria-label="Notifications"
        className="cad-notif-bell"
        style={{ color: "#475569" }}
      />
    </Badge>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      trigger={["click"]}
      placement="bottomRight"
      popupRender={dropdownRender}
      getPopupContainer={() => document.body}
      styles={{
        root: { zIndex: 1050 },
      }}
    >
      {trigger}
    </Dropdown>
  );
}
