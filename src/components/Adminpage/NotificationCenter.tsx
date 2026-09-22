import React, { useState, useEffect, useRef } from "react";
import {
  FaBell,
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaExclamationTriangle,
  FaAt,
} from "react-icons/fa";
import type { AppNotification } from "../../lib/api";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStreamUrl,
} from "../../lib/api";

interface NotificationCenterProps {
  onProjectEvent?: (notification: AppNotification) => void;
  onSelectProject?: (projectId: string, notif?: AppNotification) => void;
}

// Format relative time helper
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onProjectEvent,
  onSelectProject,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Fetch notifications on mount
  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  useEffect(() => {
    loadNotifications();

    // 2. Real-time Server-Sent Events (SSE) stream
    let eventSource: EventSource | null = null;
    try {
      const streamUrl = getNotificationStreamUrl();
      eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(":")) return;
          const payload = JSON.parse(event.data);

          if (payload.type === "connected") {
            return;
          }

          const newNotif: AppNotification = {
            id: payload._id || payload.id || String(Date.now()),
            title: payload.title || "Notification",
            message: payload.message || "",
            type: payload.type || "info",
            projectId: payload.projectId || null,
            projectName: payload.projectName || "",
            author: payload.author || { name: "User" },
            isRead: false,
            createdAt: payload.createdAt || new Date().toISOString(),
          };

          // Prepend to notifications list
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setUnreadCount((prev) => prev + 1);

          // Add to live toast queue
          setToasts((prev) => [newNotif, ...prev.slice(0, 3)]);

          // Trigger table refresh or handler
          if (onProjectEvent) {
            onProjectEvent(newNotif);
          }
        } catch (e) {
          console.error("Error parsing SSE notification:", e);
        }
      };

      eventSource.onerror = () => {
        // SSE auto-reconnects natively
      };
    } catch (err) {
      console.error("Error setting up SSE:", err);
    }

    // 3. Fallback polling every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Auto-dismiss toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, prev.length - 1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Mark a single notification as read
  const handleMarkAsRead = async (notif: AppNotification) => {
    if (notif.isRead) return;
    try {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Delete notification
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      loadNotifications();
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    handleMarkAsRead(notif);
    if (notif.projectId && onSelectProject) {
      onSelectProject(notif.projectId, notif);
      setIsOpen(false);
    }
  };

  // Render badge icon by type
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "create":
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#059669",
              border: "1px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaPlus />
          </div>
        );
      case "update":
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#eff6ff",
              color: "#2563eb",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaPencilAlt />
          </div>
        );
      case "delete":
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaTrash />
          </div>
        );
      case "warning":
      case "alert":
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#fffbeb",
              color: "#d97706",
              border: "1px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaExclamationTriangle />
          </div>
        );
      case "mention":
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#f5f3ff",
              color: "#7c3aed",
              border: "1px solid #ddd6fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            <FaAt />
          </div>
        );
      default:
        return (
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "#f8fafc",
              color: "#64748b",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              flexShrink: 0,
            }}
          >
            <FaInfoCircle />
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.isRead;
    return true;
  });

  return (
    <div style={{ position: "relative", zIndex: isOpen ? 1000 : "auto" }} ref={dropdownRef}>
      {/* 1. BELL BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          border: isOpen ? "1.5px solid #3b82f6" : "1px solid #cbd5e1",
          background: isOpen ? "#eff6ff" : "#ffffff",
          color: isOpen ? "#2563eb" : "#334155",
          cursor: "pointer",
          fontSize: "16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          transition: "all 0.18s ease",
          outline: "none",
        }}
        title="Notifications"
      >
        <FaBell style={{ transform: unreadCount > 0 ? "rotate(8deg)" : "none" }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 800,
              minWidth: "18px",
              height: "18px",
              padding: "0 4px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 5px rgba(220, 38, 38, 0.4)",
              animation: "pulse 2s infinite",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 2. DROPDOWN POPOVER */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fafbfd",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "10px",
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  transition: "background 0.15s ease",
                }}
              >
                <FaCheck style={{ fontSize: "10px" }} /> Mark all read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div
            style={{
              display: "flex",
              padding: "8px 16px",
              background: "#ffffff",
              borderBottom: "1px solid #f1f5f9",
              gap: "8px",
            }}
          >
            <button
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                border: "none",
                background: activeFilter === "all" ? "#f1f5f9" : "transparent",
                color: activeFilter === "all" ? "#0f172a" : "#64748b",
                fontWeight: activeFilter === "all" ? 700 : 500,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              style={{
                padding: "4px 12px",
                borderRadius: "16px",
                border: "none",
                background: activeFilter === "unread" ? "#eff6ff" : "transparent",
                color: activeFilter === "unread" ? "#2563eb" : "#64748b",
                fontWeight: activeFilter === "unread" ? 700 : 500,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              maxHeight: "400px",
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: "45px 20px",
                  textAlign: "center",
                  color: "#94a3b8",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "10px",
                    opacity: 0.6,
                  }}
                >
                  🔔
                </div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#64748b" }}>
                  {activeFilter === "unread" ? "No unread notifications" : "No notifications yet"}
                </div>
                <div style={{ fontSize: "12px", marginTop: "4px" }}>
                  When projects are added, edited, or deleted, you'll see them here.
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    borderBottom: "1px solid #f8fafc",
                    background: notif.isRead
                      ? "#ffffff"
                      : notif.type === "warning" || notif.type === "alert"
                      ? "#fffdf5"
                      : notif.type === "mention"
                      ? "#faf5ff"
                      : "#f8fafc",
                    cursor: notif.projectId ? "pointer" : "default",
                    transition: "background 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      notif.type === "warning" || notif.type === "alert"
                        ? "#fef9c3"
                        : notif.type === "mention"
                        ? "#f3e8ff"
                        : "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead
                      ? "#ffffff"
                      : notif.type === "warning" || notif.type === "alert"
                      ? "#fffdf5"
                      : notif.type === "mention"
                      ? "#faf5ff"
                      : "#f8fafc";
                  }}
                >
                  {/* Unread indicator dot */}
                  {!notif.isRead && (
                    <span
                      style={{
                        position: "absolute",
                        left: "6px",
                        top: "16px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background:
                          notif.type === "warning" || notif.type === "alert"
                            ? "#f59e0b"
                            : notif.type === "mention"
                            ? "#7c3aed"
                            : "#3b82f6",
                      }}
                    />
                  )}

                  {/* Type Icon */}
                  {renderTypeIcon(notif.type)}

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: notif.isRead ? 600 : 700,
                          fontSize: "13px",
                          color: "#0f172a",
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "12.5px",
                        color: notif.isRead ? "#64748b" : "#334155",
                        margin: "3px 0 5px 0",
                        lineHeight: "17px",
                        wordBreak: "break-word",
                      }}
                    >
                      {notif.message}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        color: "#94a3b8",
                      }}
                    >
                      <span>
                        by{" "}
                        <strong style={{ color: "#475569" }}>
                          {notif.author?.name || "System"}
                        </strong>
                      </span>

                      <button
                        onClick={(e) => handleDelete(e, notif.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#cbd5e1",
                          cursor: "pointer",
                          padding: "2px 4px",
                          fontSize: "11px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                        title="Delete notification"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. REAL-TIME TOAST NOTIFICATION POPUPS */}
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "380px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={`toast-${toast.id}`}
            onClick={() => {
              handleNotificationClick(toast);
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
            style={{
              pointerEvents: "auto",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "12px 16px",
              borderLeft:
                toast.type === "warning" || toast.type === "alert"
                  ? "4px solid #f59e0b"
                  : toast.type === "mention"
                  ? "4px solid #8b5cf6"
                  : "none",
              boxShadow:
                toast.type === "warning" || toast.type === "alert"
                  ? "0 15px 30px -5px rgba(217, 119, 6, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.3)"
                  : toast.type === "mention"
                  ? "0 15px 30px -5px rgba(139, 92, 246, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.25)"
                  : "0 15px 30px -5px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              cursor: toast.projectId ? "pointer" : "default",
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transition: "transform 0.15s ease",
            }}
          >
            {renderTypeIcon(toast.type)}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color:
                      toast.type === "warning" || toast.type === "alert"
                        ? "#fbbf24"
                        : toast.type === "mention"
                        ? "#c4b5fd"
                        : "#f8fafc",
                  }}
                >
                  {toast.title}
                </span>
                <span style={{ fontSize: "10.5px", color: "#94a3b8" }}>Just now</span>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "#cbd5e1",
                  margin: "3px 0 0 0",
                  lineHeight: "16px",
                }}
              >
                {toast.message}
              </p>
              <div style={{ fontSize: "10.5px", color: "#94a3b8", marginTop: "4px" }}>
                by <span style={{ color: "#38bdf8" }}>{toast.author?.name || "User"}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "2px",
                fontSize: "12px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
