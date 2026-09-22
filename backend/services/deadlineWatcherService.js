import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { notificationService } from "./notificationService.js";

/**
 * Robust date parser supporting DD/MM/YYYY, YYYY-MM-DD, and ISO strings.
 */
export function parseSafeDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;

  // Format DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Checks if a status represents a finished/completed project
 */
export function isCompletedStatus(status) {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return (
    s === "completed" ||
    s === "complété" ||
    s === "complete" ||
    s === "terminé" ||
    s === "termine" ||
    s.includes("completed") ||
    s.includes("complété")
  );
}

let isScanning = false;
let lastScanTimestamp = 0;

/**
 * Evaluates a single project to see if its target date has expired,
 * and if so, creates and broadcasts a warning notification if not already notified.
 */
export async function checkSingleProjectDeadline(project) {
  if (!project || !project.date) return null;

  // Skip completed projects
  if (isCompletedStatus(project.status)) return null;

  const targetDate = parseSafeDate(project.date);
  if (!targetDate) return null;

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  ).getTime();

  // If today is strictly past target date midnight, the project is overdue
  if (todayMidnight <= targetMidnight) {
    return null;
  }

  const daysOverdue = Math.max(
    1,
    Math.floor((todayMidnight - targetMidnight) / (1000 * 60 * 60 * 24))
  );

  // Check if an alert for this project and this exact targetDate already exists
  const existingAlert = await Notification.findOne({
    projectId: project._id,
    "metadata.reason": "target_date_overdue",
    "metadata.targetDate": String(project.date).trim(),
  });

  if (existingAlert) {
    return null; // Already alerted for this target date
  }

  // Create and broadcast alert notification
  const dayText = daysOverdue === 1 ? "1 day" : `${daysOverdue} days`;
  const notif = await notificationService.createAndBroadcastNotification({
    title: "Alert: Target Date Overdue",
    message: `Project "${project.name}" has exceeded its target date (${project.date}) by ${dayText}.`,
    type: "warning",
    projectId: project._id,
    projectName: project.name,
    author: {
      name: "System Alert",
      email: "system@advanced-solar.internal",
      role: "system",
    },
    metadata: {
      reason: "target_date_overdue",
      targetDate: String(project.date).trim(),
      daysOverdue,
      status: project.status,
    },
  });

  console.log(`⚠️ [DeadlineWatcher] Alert generated for project "${project.name}" (${dayText} overdue)`);

  return notif;
}

/**
 * Updates any previously generated French overdue notifications in MongoDB to English.
 */
export async function updateExistingAlertsToEnglish() {
  try {
    const overdueNotifs = await Notification.find({
      "metadata.reason": "target_date_overdue",
    });

    for (const notif of overdueNotifs) {
      const days = notif.metadata?.daysOverdue || 1;
      const targetDate = notif.metadata?.targetDate || "";
      const dayText = days === 1 ? "1 day" : `${days} days`;
      notif.title = "Alert: Target Date Overdue";
      notif.message = `Project "${notif.projectName}" has exceeded its target date (${targetDate}) by ${dayText}.`;
      if (!notif.author) notif.author = {};
      notif.author.name = "System Alert";
      await notif.save();
    }
  } catch (err) {
    console.error("Error updating existing alerts to English:", err);
  }
}

/**
 * Scans all active projects and emits notifications for overdue ones.
 * Guaranteed debounce of at least 30 seconds between full scans.
 */
export async function checkOverdueProjects(force = false) {
  const now = Date.now();
  if (!force && now - lastScanTimestamp < 30000) {
    return { skipped: true, reason: "debounced" };
  }

  if (isScanning) {
    return { skipped: true, reason: "already_scanning" };
  }

  isScanning = true;
  lastScanTimestamp = now;

  try {
    const projects = await Project.find({}).lean();
    let alertCount = 0;

    for (const project of projects) {
      const created = await checkSingleProjectDeadline(project);
      if (created) alertCount++;
    }

    if (alertCount > 0) {
      console.log(`🔔 [DeadlineWatcher] Scan finished: ${alertCount} new alert(s) generated.`);
    }

    return { success: true, alertCount, scannedCount: projects.length };
  } catch (err) {
    console.error("❌ [DeadlineWatcher] Error during deadline scan:", err);
    return { success: false, error: err.message };
  } finally {
    isScanning = false;
  }
}

/**
 * Starts background watcher timer (every 15 minutes by default).
 */
export function startDeadlineWatcher(intervalMinutes = 15) {
  console.log(`⏱️ [DeadlineWatcher] Deadline watcher service started (interval: ${intervalMinutes} min).`);

  // Migrate existing alerts to English & run initial scan
  setTimeout(async () => {
    await updateExistingAlertsToEnglish();
    checkOverdueProjects(true);
  }, 2000);

  // Periodic interval
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;
  return setInterval(() => {
    checkOverdueProjects();
  }, intervalMs);
}
