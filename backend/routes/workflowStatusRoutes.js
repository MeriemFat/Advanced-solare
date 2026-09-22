import express from "express";
import {
  getWorkflowStatuses,
  createWorkflowStatus,
  updateWorkflowStatus,
  deleteWorkflowStatus,
  reorderWorkflowStatuses,
} from "../controllers/workflowStatusController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getWorkflowStatuses);
router.post("/", createWorkflowStatus);
router.post("/reorder", reorderWorkflowStatuses);
router.put("/:id", updateWorkflowStatus);
router.delete("/:id", deleteWorkflowStatus);

export default router;
