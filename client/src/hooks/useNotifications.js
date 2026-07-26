import { useEffect, useState, useCallback } from "react";
import socket from "../services/socket";
import { notificationService } from "../services/notificationService";

/**
 * Powers the notification bell in both CustomerLayout and SellerLayout.
 * "identify"s the socket so the server can push personal events (follow-based
 * stream/coupon/flash-sale alerts, order updates) to this exact user even
 * when they're nowhere near a live session room — see socketHandler.js's
 * `identify` handler and notifyFollowers().
 */
export function useNotifications(role, userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    if (!role || !userId) return;
    notificationService
      .getMine(role)
      .then(({ notifications: list, unreadCount: count }) => {
        setNotifications(list);
        setUnreadCount(count);
      })
      .catch(() => {});
  }, [role, userId]);

  useEffect(() => {
    if (!role || !userId) return undefined;

    function identify() {
      socket.emit("identify", { role, userId });
    }
    if (socket.connected) identify();
    socket.on("connect", identify);

    function handleNotification(payload) {
      setNotifications((prev) => [{ ...payload, _id: `live-${Date.now()}`, read: false, createdAt: new Date().toISOString() }, ...prev].slice(0, 30));
      setUnreadCount((prev) => prev + 1);
    }
    socket.on("notification", handleNotification);

    refresh();

    return () => {
      socket.off("connect", identify);
      socket.off("notification", handleNotification);
    };
  }, [role, userId, refresh]);

  const markAllRead = useCallback(() => {
    if (!role) return;
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificationService.markAllRead(role).catch(() => {});
  }, [role]);

  return { notifications, unreadCount, markAllRead, refresh };
}
