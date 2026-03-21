import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../services/apiClient.js";

const POLL_INTERVAL_MS = 20_000;

const getErrorMessage = (err) =>
  err.response?.data?.message ?? err.message ?? "Something went wrong";

function extractNotificationsList(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.notifications)) return body.notifications;
  if (Array.isArray(body.items)) return body.items;
  if (body.data && Array.isArray(body.data.notifications))
    return body.data.notifications;
  return [];
}

export function normalizeNotification(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id ?? raw._id;
  if (id == null) return null;
  return {
    id: String(id),
    title: raw.title ?? "Notification",
    message: raw.message ?? raw.body ?? "",
    isRead: raw.isRead === true || raw.read === true,
    createdAt: raw.createdAt ?? raw.created_at ?? raw.updatedAt ?? null,
    entityType: raw.entityType ?? raw.entity_type ?? null,
    entityId: raw.entityId ?? raw.entity_id ?? null,
  };
}

/**
 * Polls notifications, supports mark-as-read with optimistic updates.
 * @param {{ enabled?: boolean, page?: number, limit?: number, onError?: (msg: string, meta?: { silent?: boolean }) => void }} options
 */
export function useNotifications(options = {}) {
  const {
    enabled = true,
    page = 1,
    limit = 20,
    onError,
  } = options;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(
    async (opts = { silent: false }) => {
      if (!enabled) return;
      const silent = opts.silent === true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const { data: body } = await apiClient.get("/api/notifications", {
          params: { page, limit },
        });
        const list = extractNotificationsList(body);
        const normalized = list
          .map(normalizeNotification)
          .filter(Boolean);
        setNotifications(normalized);
        setError(null);
      } catch (err) {
        const msg = getErrorMessage(err);
        if (!silent) {
          setError(msg);
          onErrorRef.current?.(msg, { silent: false });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [enabled, page, limit],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchNotifications({ silent: false });
  }, [enabled, fetchNotifications]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, fetchNotifications]);

  const refetch = useCallback(() => {
    return fetchNotifications({ silent: false });
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    let snapshot;
    setNotifications((list) => {
      snapshot = list;
      return list.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n,
      );
    });
    try {
      await apiClient.post(`/api/notifications/${notificationId}/read`);
    } catch (err) {
      if (snapshot) setNotifications(snapshot);
      const msg = getErrorMessage(err);
      onErrorRef.current?.(msg, { silent: false });
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    let snapshot;
    setNotifications((list) => {
      snapshot = list;
      return list.map((n) => ({ ...n, isRead: true }));
    });
    try {
      await apiClient.post("/api/notifications/read-all");
    } catch (err) {
      if (snapshot) setNotifications(snapshot);
      const msg = getErrorMessage(err);
      onErrorRef.current?.(msg, { silent: false });
      throw err;
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refetch,
    markAsRead,
    markAllAsRead,
  };
}
