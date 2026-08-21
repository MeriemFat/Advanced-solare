import { Router } from "express";
import { protect, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  uploadProjectFileMiddleware,
  uploadProjectImageMiddleware,
} from "../middleware/upload.js";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectFile,
  deleteProjectFile,
  downloadProjectFile,
  uploadProjectImage,
  deleteProjectImage,
  downloadProjectImage,
  addProjectComment,
  deleteProjectComment,
  addCommentReply,
  deleteCommentReply,
  addProjectLink,
  deleteProjectLink,
  exportProjectFilesZip,
  exportAllUploadedFilesZip,
  exportProjectsCSV,
  exportProjectsPDF,
} from "../controllers/projectController.js";

const router = Router();

router.use(protect, requireRole("admin", "subadmin"));

// Global export endpoints (MUST come before /:id)
router.get("/export/csv", asyncHandler(exportProjectsCSV));
router.get("/export/pdf", asyncHandler(exportProjectsPDF));
router.get("/export/zip", asyncHandler(exportAllUploadedFilesZip));

// CRUD endpoints
router.get("/", asyncHandler(getProjects));
router.get("/:id", asyncHandler(getProject));
router.post("/", asyncHandler(createProject));
router.put("/:id", asyncHandler(updateProject));
router.delete("/:id", asyncHandler(deleteProject));

// Single Project ZIP Export
router.get("/:id/export/zip", asyncHandler(exportProjectFilesZip));

// Project Files
router.post(
  "/:id/files",
  uploadProjectFileMiddleware.single("file"),
  asyncHandler(uploadProjectFile)
);
router.delete("/:id/files/:fileId", asyncHandler(deleteProjectFile));
router.get("/:id/files/:fileId/download", asyncHandler(downloadProjectFile));

// Project Images
router.post(
  "/:id/images",
  uploadProjectImageMiddleware.single("image"),
  asyncHandler(uploadProjectImage)
);
router.delete("/:id/images/:imageId", asyncHandler(deleteProjectImage));
router.get("/:id/images/:imageId/download", asyncHandler(downloadProjectImage));

// Project Comments & Replies
router.post("/:id/comments", asyncHandler(addProjectComment));
router.delete("/:id/comments/:commentId", asyncHandler(deleteProjectComment));
router.post("/:id/comments/:commentId/replies", asyncHandler(addCommentReply));
router.delete("/:id/comments/:commentId/replies/:replyId", asyncHandler(deleteCommentReply));

// Project Links
router.post("/:id/links", asyncHandler(addProjectLink));
router.delete("/:id/links/:linkId", asyncHandler(deleteProjectLink));

export default router;
