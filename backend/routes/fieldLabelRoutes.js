import express from "express";
import {
  getFieldLabels,
  updateFieldLabels,
  resetFieldLabels,
} from "../controllers/fieldLabelController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getFieldLabels);
router.put("/", updateFieldLabels);
router.post("/reset", resetFieldLabels);

export default router;
