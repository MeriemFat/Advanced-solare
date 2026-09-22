import express from "express";
import {
  getCustomVariables,
  createCustomVariable,
  updateCustomVariable,
  deleteCustomVariable,
} from "../controllers/customVariableController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getCustomVariables);
router.post("/", createCustomVariable);
router.put("/:id", updateCustomVariable);
router.delete("/:id", deleteCustomVariable);

export default router;
