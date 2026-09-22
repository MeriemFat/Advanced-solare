import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";
import { notificationService } from "../services/notificationService.js";
import { checkOverdueProjects } from "../services/deadlineWatcherService.js";

export async function streamNotifications(req, res) {
  let userId = null;

  // Check token from query param or header
  const token =
    req.query.token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      // Allow connection even if token expired or invalid, or close if strict
    }
  }

  notificationService.addClient(res, userId);
}

export async function getNotifications(req, res) {
  try {
    // Run deadline check (debounced automatically to avoid repeated scans)
    await checkOverdueProjects();

    const userId = req.user?.id;
    const query = {
      $or: [
        { recipient: null },
        { recipient: { $exists: false } },
        ...(userId ? [{ recipient: userId }] : []),
      ],
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const formatted = notifications.map((n) => ({
      ...n,
      id: n._id.toString(),
      isRead: userId
        ? (n.readBy || []).some((uid) => uid.toString() === userId.toString())
        : false,
    }));

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.json({
      notifications: formatted,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch notifications" });
  }
}

export async function markAsRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userId } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      ...notification,
      id: notification._id.toString(),
      isRead: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark notification as read" });
  }
}

export async function markAllAsRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    await Notification.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark all as read" });
  }
}

export async function deleteNotification(req, res) {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete notification" });
  }
}

export async function checkDeadlinesManual(req, res) {
  try {
    const result = await checkOverdueProjects(true);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to check deadlines" });
  }
}

