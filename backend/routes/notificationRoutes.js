import express from "express";
import {
  streamNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  checkDeadlinesManual,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// SSE stream (accepts token via query param ?token=... or header)
router.get("/stream", streamNotifications);

// Protected routes
router.use(protect);
router.get("/", getNotifications);
router.post("/check-deadlines", checkDeadlinesManual);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
