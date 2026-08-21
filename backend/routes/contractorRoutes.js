import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
} from "../controllers/contractorController.js";

const router = Router();

router.use(protect, requireRole("admin", "subadmin"));

router.get("/", asyncHandler(getContractors));
router.get("/:id", asyncHandler(getContractor));
router.post("/", asyncHandler(createContractor));
router.put("/:id", asyncHandler(updateContractor));
router.delete("/:id", asyncHandler(deleteContractor));

export default router;
