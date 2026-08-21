import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  getSubadmins,
  createSubadmin,
  updateSubadmin,
  deleteSubadmin,
} from "../controllers/userController.js";

const router = Router();

// Only Super Admin can access sub-admin management
router.use(protect, requireRole("admin"));

router.get("/subadmins", asyncHandler(getSubadmins));
router.post("/subadmins", asyncHandler(createSubadmin));
router.put("/subadmins/:id", asyncHandler(updateSubadmin));
router.delete("/subadmins/:id", asyncHandler(deleteSubadmin));

export default router;
