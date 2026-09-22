import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import PDFDocument from "pdfkit";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { notificationService } from "../services/notificationService.js";
import { checkSingleProjectDeadline } from "../services/deadlineWatcherService.js";

async function resolveAuthor(req) {
  if (req.user?.name) {
    return {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email || "",
      role: req.user.role || "",
    };
  }
  if (req.user?.id) {
    try {
      const u = await User.findById(req.user.id).select("name email role").lean();
      if (u) {
        return {
          id: u._id,
          name: u.name,
          email: u.email || "",
          role: u.role || "",
        };
      }
    } catch {}
  }
  return { id: null, name: "Admin", email: "", role: "admin" };
}

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTOR_FIELDS = "nom";

export async function getProjects(req, res) {
  const filter = {};
  if (req.query.serviceType) {
    filter.serviceType = req.query.serviceType;
  }
  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .populate("contractor", CONTRACTOR_FIELDS);
  res.json(projects);
}

export async function getProject(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }
  res.json(project);
}

export async function createProject(req, res) {
  const {
    name,
    description,
    status,
    serviceType,
    date,
    contractor,
    priority,
    projectType,
    idReview,
    updates,
    pmName,
    pmEmails,
    peerReview,
    drafterName,
    drafterEmails,
    submittedDate,
    rfiStatus,
    pmStatus,
    draftingStatus,
    qaAndDeliveryStatus,
    projectSs,
    seTime,
    structEngi,
    customFields,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Project name is required." });
  }

  // Check if project with the same name already exists (case-insensitive)
  const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingProject = await Project.findOne({
    name: { $regex: new RegExp(`^${escapedName}$`, "i") },
  });

  if (existingProject) {
    return res.status(409).json({
      message: `A project named "${name.trim()}" already exists. Please choose a unique project name.`,
    });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const futureDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const finalSubmittedDate = (submittedDate && typeof submittedDate === "string") ? submittedDate.trim() : "";
  if (finalSubmittedDate && finalSubmittedDate > todayStr) {
    return res.status(400).json({
      message: "La date de soumission (submittedDate) ne peut pas être dans le futur (aujourd'hui ou passé).",
    });
  }

  const finalDate = date || futureDateStr;
  if (date && date < todayStr) {
    return res.status(400).json({
      message: "La date cible (Target Date) ne peut pas être dans le passé (aujourd'hui ou futur).",
    });
  }

  const finalStatus = status || "Project initiation & Discovery";
  const now = new Date();

  const project = await Project.create({
    name,
    description: description || "",
    status: finalStatus,
    serviceType: serviceType || "Plan Set Design",
    statusUpdatedAt: now,
    statusHistory: [
      {
        status: finalStatus,
        changedAt: now,
        changedBy: req.user?.name || "Admin",
      },
    ],
    date: finalDate,
    contractor: contractor || null,
    priority: priority || "Medium",
    projectType: projectType !== undefined ? projectType : [],
    idReview: idReview || "",
    updates: updates || "",
    pmName: pmName || "",
    pmEmails: pmEmails || "",
    peerReview: peerReview || "",
    drafterName: drafterName || "",
    drafterEmails: drafterEmails || "",
    submittedDate: finalSubmittedDate,
    rfiStatus: rfiStatus || "",
    pmStatus: pmStatus || "",
    draftingStatus: draftingStatus || "",
    qaAndDeliveryStatus: qaAndDeliveryStatus || "",
    projectSs: projectSs || "",
    seTime: seTime || "",
    structEngi: structEngi || "",
    customFields: customFields || {},
  });
  await project.populate("contractor", CONTRACTOR_FIELDS);

  // Broadcast creation notification to all dashboard users
  const author = await resolveAuthor(req);
  notificationService.createAndBroadcastNotification({
    title: "New Project Created",
    message: `${author.name} created project "${project.name}".`,
    type: "create",
    projectId: project._id,
    projectName: project.name,
    author,
  });

  // Evaluate target date deadline immediately
  checkSingleProjectDeadline(project).catch((err) =>
    console.error("Error checking deadline on create:", err)
  );

  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const existing = await Project.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const {
    name,
    description,
    status,
    serviceType,
    date,
    contractor,
    priority,
    projectType,
    idReview,
    updates,
    pmName,
    pmEmails,
    peerReview,
    drafterName,
    drafterEmails,
    submittedDate,
    rfiStatus,
    pmStatus,
    draftingStatus,
    qaAndDeliveryStatus,
    projectSs,
    seTime,
    structEngi,
    customFields,
  } = req.body;

  const updateData = {};
  if (name !== undefined) {
    const trimmed = name.trim();
    if (trimmed && trimmed.toLowerCase() !== existing.name.trim().toLowerCase()) {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Project.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${escaped}$`, "i") },
      });
      if (duplicate) {
        return res.status(409).json({
          message: `A project named "${trimmed}" already exists. Please choose a unique project name.`,
        });
      }
    }
    updateData.name = trimmed;
  }
  if (description !== undefined) updateData.description = description;
  if (serviceType !== undefined) updateData.serviceType = serviceType;
  const todayStr = new Date().toISOString().slice(0, 10);
  if (date !== undefined) {
    if (date && date !== existing.date && date < todayStr) {
      return res.status(400).json({
        message: "La date cible (Target Date) ne peut pas être dans le passé (aujourd'hui ou futur).",
      });
    }
    updateData.date = date;
  }
  if (contractor !== undefined) updateData.contractor = contractor || null;
  if (priority !== undefined) updateData.priority = priority;
  if (projectType !== undefined) updateData.projectType = projectType;
  if (idReview !== undefined) updateData.idReview = idReview;
  if (updates !== undefined) updateData.updates = updates;
  if (pmName !== undefined) updateData.pmName = pmName;
  if (pmEmails !== undefined) updateData.pmEmails = pmEmails;
  if (peerReview !== undefined) updateData.peerReview = peerReview;
  if (drafterName !== undefined) updateData.drafterName = drafterName;
  if (drafterEmails !== undefined) updateData.drafterEmails = drafterEmails;
  if (submittedDate !== undefined) {
    const trimmedSubmitted = typeof submittedDate === "string" ? submittedDate.trim() : "";
    if (trimmedSubmitted && trimmedSubmitted !== existing.submittedDate && trimmedSubmitted > todayStr) {
      return res.status(400).json({
        message: "La date de soumission (submittedDate) ne peut pas être dans le futur (aujourd'hui ou passé).",
      });
    }
    updateData.submittedDate = trimmedSubmitted;
  }
  if (rfiStatus !== undefined) updateData.rfiStatus = rfiStatus;
  if (pmStatus !== undefined) updateData.pmStatus = pmStatus;
  if (draftingStatus !== undefined) updateData.draftingStatus = draftingStatus;
  if (qaAndDeliveryStatus !== undefined) updateData.qaAndDeliveryStatus = qaAndDeliveryStatus;
  if (projectSs !== undefined) updateData.projectSs = projectSs;
  if (seTime !== undefined) updateData.seTime = seTime;
  if (structEngi !== undefined) updateData.structEngi = structEngi;
  if (customFields !== undefined) {
    updateData.customFields = {
      ...(existing.customFields || {}),
      ...customFields,
    };
  }

  if (req.body.isInvoiced !== undefined) updateData.isInvoiced = Boolean(req.body.isInvoiced);
  if (req.body.invoiceStatus !== undefined) updateData.invoiceStatus = req.body.invoiceStatus;
  if (req.body.invoiceNumber !== undefined) updateData.invoiceNumber = String(req.body.invoiceNumber).trim();
  if (req.body.invoiceDate !== undefined) updateData.invoiceDate = req.body.invoiceDate;
  if (req.body.invoiceAmount !== undefined) updateData.invoiceAmount = Number(req.body.invoiceAmount) || 0;
  if (req.body.invoiceNotes !== undefined) updateData.invoiceNotes = req.body.invoiceNotes;

  if (status !== undefined && status !== existing.status) {
    const now = new Date();
    updateData.status = status;
    updateData.statusUpdatedAt = now;
    updateData.$push = {
      statusHistory: {
        status,
        changedAt: now,
        changedBy: req.user?.name || "Admin",
      },
    };
  }

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate("contractor", CONTRACTOR_FIELDS);

  // Build a concise summary of what was modified
  const changes = [];
  if (name !== undefined && name.trim() !== existing.name.trim()) changes.push(`renamed to "${project.name}"`);
  if (status !== undefined && status !== existing.status) changes.push(`status "${status}"`);
  if (priority !== undefined && priority !== existing.priority) changes.push(`priority "${priority}"`);
  if (projectType !== undefined) changes.push("project type updated");
  if (structEngi !== undefined && structEngi !== existing.structEngi) changes.push(`Struct Engi "${structEngi}"`);
  if (contractor !== undefined) changes.push("contractor updated");
  if (date !== undefined && date !== existing.date) changes.push(`target date "${date}"`);
  if (description !== undefined && description !== existing.description) changes.push("description updated");

  const author = await resolveAuthor(req);
  const changeSummary = changes.length > 0 ? ` (${changes.slice(0, 2).join(", ")})` : "";

  notificationService.createAndBroadcastNotification({
    title: "Project Updated",
    message: `${author.name} updated project "${project.name}"${changeSummary}.`,
    type: "update",
    projectId: project._id,
    projectName: project.name,
    author,
    metadata: { changedFields: Object.keys(updateData) },
  });

  // Re-evaluate target date deadline immediately upon project update
  checkSingleProjectDeadline(project).catch((err) =>
    console.error("Error checking deadline on update:", err)
  );

  res.json(project);
}

export async function deleteProject(req, res) {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  // Broadcast deletion notification to all dashboard users
  const author = await resolveAuthor(req);
  notificationService.createAndBroadcastNotification({
    title: "Project Deleted",
    message: `${author.name} deleted project "${project.name}".`,
    type: "delete",
    projectId: project._id,
    projectName: project.name,
    author,
  });

  // Delete attached files from disk
  if (project.files && project.files.length > 0) {
    for (const file of project.files) {
      try {
        const filePath = path.resolve(__dirname, "..", "uploads", "projects", file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`Erreur lors de la suppression du fichier ${file.filename}:`, err);
      }
    }
  }

  // Delete attached images from disk
  if (project.images && project.images.length > 0) {
    for (const image of project.images) {
      try {
        const imagePath = path.resolve(__dirname, "..", "uploads", "images", image.filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error(`Erreur lors de la suppression de l'image ${image.filename}:`, err);
      }
    }
  }

  res.json({ message: "Projet supprimé" });
}

export async function uploadProjectFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Aucun fichier fourni" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );

  if (!project) {
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const fileDoc = {
    name: req.body.name || req.file.originalname,
    originalName: req.file.originalname,
    filename: req.file.filename,
    url: `/uploads/projects/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedAt: new Date(),
  };

  project.files.push(fileDoc);
  await project.save();

  res.status(201).json({
    message: "Fichier téléchargé avec succès",
    file: project.files[project.files.length - 1],
    project,
  });
}

export async function deleteProjectFile(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );

  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const fileItem = project.files.id(req.params.fileId);
  if (!fileItem) {
    return res.status(404).json({ message: "Fichier introuvable" });
  }

  try {
    const filePath = path.resolve(__dirname, "..", "uploads", "projects", fileItem.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Erreur suppression fichier disque ${fileItem.filename}:`, err);
  }

  project.files.pull(req.params.fileId);
  await project.save();

  res.json({
    message: "Fichier supprimé avec succès",
    project,
  });
}

export async function downloadProjectFile(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const fileItem = project.files.id(req.params.fileId);
  if (!fileItem) {
    return res.status(404).json({ message: "Fichier introuvable" });
  }

  const filePath = path.resolve(__dirname, "..", "uploads", "projects", fileItem.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Fichier non trouvé sur le serveur" });
  }

  const downloadName = fileItem.originalName || fileItem.name || fileItem.filename;
  res.download(filePath, downloadName);
}

export async function uploadProjectImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Aucune image fournie" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );

  if (!project) {
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch {}
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const imageDoc = {
    title: req.body.title || req.file.originalname,
    originalName: req.file.originalname,
    filename: req.file.filename,
    url: `/uploads/images/${req.file.filename}`,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedAt: new Date(),
  };

  project.images.push(imageDoc);
  await project.save();

  res.status(201).json({
    message: "Image téléchargée avec succès",
    image: project.images[project.images.length - 1],
    project,
  });
}

export async function deleteProjectImage(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );

  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const imageItem = project.images.id(req.params.imageId);
  if (!imageItem) {
    return res.status(404).json({ message: "Image introuvable" });
  }

  try {
    const imagePath = path.resolve(__dirname, "..", "uploads", "images", imageItem.filename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  } catch (err) {
    console.error(`Erreur suppression image disque ${imageItem.filename}:`, err);
  }

  project.images.pull(req.params.imageId);
  await project.save();

  res.json({
    message: "Image supprimée avec succès",
    project,
  });
}

export async function downloadProjectImage(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const imageItem = project.images.id(req.params.imageId);
  if (!imageItem) {
    return res.status(404).json({ message: "Image introuvable" });
  }

  const imagePath = path.resolve(__dirname, "..", "uploads", "images", imageItem.filename);
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ message: "Image non trouvée sur le serveur" });
  }

  const downloadName = imageItem.originalName || imageItem.filename;
  res.download(imagePath, downloadName);
}

async function notifyMentionedUsers({
  text,
  project,
  commentItem,
  author,
  senderId,
  isReply = false,
  parentComment = null,
}) {
  try {
    const allUsers = await User.find({}).select("_id name email").lean();
    const normalizedText = text.toLowerCase();

    const mentionedUsers = allUsers.filter((u) => {
      // Don't notify the author themselves
      if (senderId && u._id.toString() === senderId.toString()) return false;
      const fullNameTag = `@${u.name.toLowerCase()}`;
      if (normalizedText.includes(fullNameTag)) return true;
      const firstName = u.name.split(" ")[0].toLowerCase();
      if (firstName.length >= 3 && normalizedText.includes(`@${firstName}`)) return true;
      if (u.email && normalizedText.includes(`@${u.email.toLowerCase()}`)) return true;
      const emailPrefix = u.email ? u.email.split("@")[0].toLowerCase() : "";
      if (emailPrefix.length >= 3 && normalizedText.includes(`@${emailPrefix}`)) return true;
      return false;
    });

    const preview = text.length > 80 ? text.slice(0, 80) + "..." : text;

    for (const user of mentionedUsers) {
      await notificationService.createAndBroadcastNotification({
        title: `Mentioned in "${project.name}"`,
        message: `${author.name || "A user"} mentioned you in a ${isReply ? "reply" : "comment"}: "${preview}"`,
        type: "mention",
        recipient: user._id,
        projectId: project._id,
        projectName: project.name,
        author,
        metadata: {
          type: "mention",
          commentId: commentItem?._id,
          targetTab: "comments",
        },
      });
      console.log(`💬 [Mention] Notification sent to @${user.name} for project "${project.name}"`);
    }

    // If this is a reply, also notify the author of the original parent comment
    if (isReply && parentComment && parentComment.author) {
      const parentAuthorRaw = parentComment.author.trim().toLowerCase();
      const parentUser = allUsers.find(
        (u) =>
          u.name.toLowerCase() === parentAuthorRaw ||
          (u.email && u.email.toLowerCase() === parentAuthorRaw)
      );

      // Only notify if parent author is not the current replier and not already in mentionedUsers
      if (
        parentUser &&
        (!senderId || parentUser._id.toString() !== senderId.toString()) &&
        !mentionedUsers.some((m) => m._id.toString() === parentUser._id.toString())
      ) {
        await notificationService.createAndBroadcastNotification({
          title: `Reply to your comment in "${project.name}"`,
          message: `${author.name || "A user"} replied to your comment: "${preview}"`,
          type: "info",
          recipient: parentUser._id,
          projectId: project._id,
          projectName: project.name,
          author,
          metadata: {
            type: "reply",
            commentId: parentComment._id,
            targetTab: "comments",
          },
        });
      }
    }
  } catch (err) {
    console.error("Error notifying mentioned users:", err);
  }
}

// Project Comments & Replies
export async function addProjectComment(req, res) {
  const { text, author } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Le texte du commentaire est requis" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const newComment = {
    author: author || req.user?.name || "Admin",
    text: text.trim(),
    date: new Date().toLocaleDateString("fr-FR"),
    replies: [],
    createdAt: new Date(),
  };

  project.comments.push(newComment);
  await project.save();

  const savedComment = project.comments[project.comments.length - 1];
  const authorInfo = await resolveAuthor(req);
  notifyMentionedUsers({
    text: text.trim(),
    project,
    commentItem: savedComment,
    author: authorInfo,
    senderId: req.user?.id || req.user?._id,
  });

  res.status(201).json({
    message: "Commentaire ajouté avec succès",
    comment: savedComment,
    project,
  });
}

export async function deleteProjectComment(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const commentItem = project.comments.id(req.params.commentId);
  if (!commentItem) {
    return res.status(404).json({ message: "Commentaire introuvable" });
  }

  project.comments.pull(req.params.commentId);
  await project.save();

  res.json({
    message: "Commentaire supprimé avec succès",
    project,
  });
}

export async function updateProjectComment(req, res) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Le texte du commentaire est requis" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const commentItem = project.comments.id(req.params.commentId);
  if (!commentItem) {
    return res.status(404).json({ message: "Commentaire introuvable" });
  }

  commentItem.text = text.trim();
  commentItem.isEdited = true;
  commentItem.updatedAt = new Date();

  await project.save();

  const authorInfo = await resolveAuthor(req);
  notifyMentionedUsers({
    text: text.trim(),
    project,
    commentItem,
    author: authorInfo,
    senderId: req.user?.id || req.user?._id,
  });

  res.json({
    message: "Commentaire modifié avec succès",
    comment: commentItem,
    project,
  });
}

export async function addCommentReply(req, res) {
  const { text, author } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Le texte de la réponse est requis" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const commentItem = project.comments.id(req.params.commentId);
  if (!commentItem) {
    return res.status(404).json({ message: "Commentaire introuvable" });
  }

  const newReply = {
    author: author || req.user?.name || "Admin",
    text: text.trim(),
    date: new Date().toLocaleDateString("fr-FR"),
    createdAt: new Date(),
  };

  commentItem.replies.push(newReply);
  await project.save();

  const savedReply = commentItem.replies[commentItem.replies.length - 1];
  const authorInfo = await resolveAuthor(req);
  notifyMentionedUsers({
    text: text.trim(),
    project,
    commentItem: savedReply,
    author: authorInfo,
    senderId: req.user?.id || req.user?._id,
    isReply: true,
    parentComment: commentItem,
  });

  res.status(201).json({
    message: "Réponse ajoutée avec succès",
    reply: savedReply,
    comment: commentItem,
    project,
  });
}

export async function updateCommentReply(req, res) {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Le texte de la réponse est requis" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const commentItem = project.comments.id(req.params.commentId);
  if (!commentItem) {
    return res.status(404).json({ message: "Commentaire introuvable" });
  }

  const replyItem = commentItem.replies.id(req.params.replyId);
  if (!replyItem) {
    return res.status(404).json({ message: "Réponse introuvable" });
  }

  replyItem.text = text.trim();
  replyItem.isEdited = true;
  replyItem.updatedAt = new Date();

  await project.save();

  const authorInfo = await resolveAuthor(req);
  notifyMentionedUsers({
    text: text.trim(),
    project,
    commentItem: replyItem,
    author: authorInfo,
    senderId: req.user?.id || req.user?._id,
    isReply: true,
    parentComment: commentItem,
  });

  res.json({
    message: "Réponse modifiée avec succès",
    reply: replyItem,
    comment: commentItem,
    project,
  });
}

export async function deleteCommentReply(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const commentItem = project.comments.id(req.params.commentId);
  if (!commentItem) {
    return res.status(404).json({ message: "Commentaire introuvable" });
  }

  const replyItem = commentItem.replies.id(req.params.replyId);
  if (!replyItem) {
    return res.status(404).json({ message: "Réponse introuvable" });
  }

  commentItem.replies.pull(req.params.replyId);
  await project.save();

  res.json({
    message: "Réponse supprimée avec succès",
    project,
  });
}

// Project Links
export async function addProjectLink(req, res) {
  const { title, url } = req.body;
  if (!title || !url) {
    return res.status(400).json({ message: "Titre et URL requis" });
  }

  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  project.links.push({ title, url, createdAt: new Date() });
  await project.save();

  res.status(201).json({
    message: "Lien ajouté avec succès",
    link: project.links[project.links.length - 1],
    project,
  });
}

export async function deleteProjectLink(req, res) {
  const project = await Project.findById(req.params.id).populate(
    "contractor",
    CONTRACTOR_FIELDS
  );
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  project.links.pull(req.params.linkId);
  await project.save();

  res.json({
    message: "Lien supprimé avec succès",
    project,
  });
}

// Export all uploaded files and images for a single project in a ZIP
export async function exportProjectFilesZip(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

  const hasFiles = project.files && project.files.length > 0;
  const hasImages = project.images && project.images.length > 0;

  if (!hasFiles && !hasImages) {
    return res.status(400).json({ message: "Ce projet n'a aucun fichier ou image à exporter" });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const safeName = (project.name || "projet").replace(/[^a-zA-Z0-9_-]/g, "_");
  const zipFileName = `${safeName}_fichiers_${new Date().toISOString().slice(0, 10)}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  archive.pipe(res);

  if (hasFiles) {
    for (const file of project.files) {
      const filePath = path.resolve(__dirname, "..", "uploads", "projects", file.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `documents/${file.originalName || file.name}` });
      }
    }
  }

  if (hasImages) {
    for (const image of project.images) {
      const imagePath = path.resolve(__dirname, "..", "uploads", "images", image.filename);
      if (fs.existsSync(imagePath)) {
        archive.file(imagePath, { name: `images/${image.originalName || image.filename}` });
      }
    }
  }

  await archive.finalize();
}

// Export all uploaded files from ALL projects in a master ZIP
export async function exportAllUploadedFilesZip(req, res) {
  const projects = await Project.find();

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const zipFileName = `tous_les_fichiers_projets_${new Date().toISOString().slice(0, 10)}.zip`;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  archive.pipe(res);

  let hasAnyFile = false;

  for (const project of projects) {
    const safeProjectFolder = `${project.name || "projet"}_${project._id.toString().slice(-4)}`
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    if (project.files && project.files.length > 0) {
      for (const file of project.files) {
        const filePath = path.resolve(__dirname, "..", "uploads", "projects", file.filename);
        if (fs.existsSync(filePath)) {
          hasAnyFile = true;
          archive.file(filePath, {
            name: `${safeProjectFolder}/documents/${file.originalName || file.name}`,
          });
        }
      }
    }

    if (project.images && project.images.length > 0) {
      for (const image of project.images) {
        const imagePath = path.resolve(__dirname, "..", "uploads", "images", image.filename);
        if (fs.existsSync(imagePath)) {
          hasAnyFile = true;
          archive.file(imagePath, {
            name: `${safeProjectFolder}/images/${image.originalName || image.filename}`,
          });
        }
      }
    }
  }

  if (!hasAnyFile) {
    archive.append("Aucun fichier téléversé pour le moment.", { name: "README.txt" });
  }

  await archive.finalize();
}

// Export all projects as CSV
export async function exportProjectsCSV(req, res) {
  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .populate("contractor", CONTRACTOR_FIELDS);

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '""';
    const str = String(field).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    "ID",
    "Nom du Projet",
    "Description",
    "Statut",
    "Priorité",
    "Type de Projet",
    "Date",
    "Submitted Date",
    "Contracteur",
    "PM Name",
    "PM Emails",
    "Drafter Name",
    "Drafter Emails",
    "Struct Engi",
    "PM Status",
    "Drafting Status",
    "QA & Delivery Status",
    "I&D Review",
    "Peer Review",
    "RFI Status",
    "Project SS",
    "SE Time",
    "Updates",
    "Nombre de Fichiers",
    "Nombre d'Images",
    "Liste des Fichiers",
    "Liste des Images",
    "Date de Création",
  ];

  const rows = projects.map((p) => {
    const fileList = (p.files || [])
      .map((f) => `${f.name} (${f.originalName})`)
      .join(" ; ");
    const imageList = (p.images || [])
      .map((img) => `${img.title || img.originalName}`)
      .join(" ; ");

    return [
      escapeCSV(p._id),
      escapeCSV(p.name),
      escapeCSV(p.description),
      escapeCSV(p.status),
      escapeCSV(p.priority || ""),
      escapeCSV(Array.isArray(p.projectType) ? p.projectType.join(", ") : (p.projectType || "")),
      escapeCSV(p.date),
      escapeCSV(p.submittedDate || ""),
      escapeCSV(p.contractor?.nom || "Non assigné"),
      escapeCSV(p.pmName || ""),
      escapeCSV(p.pmEmails || ""),
      escapeCSV(p.drafterName || ""),
      escapeCSV(p.drafterEmails || ""),
      escapeCSV(p.structEngi || ""),
      escapeCSV(p.pmStatus || ""),
      escapeCSV(p.draftingStatus || ""),
      escapeCSV(p.qaAndDeliveryStatus || ""),
      escapeCSV(p.idReview || ""),
      escapeCSV(p.peerReview || ""),
      escapeCSV(p.rfiStatus || ""),
      escapeCSV(p.projectSs || ""),
      escapeCSV(p.seTime || ""),
      escapeCSV(p.updates || ""),
      escapeCSV(p.files ? p.files.length : 0),
      escapeCSV(p.images ? p.images.length : 0),
      escapeCSV(fileList),
      escapeCSV(imageList),
      escapeCSV(p.createdAt ? new Date(p.createdAt).toLocaleDateString("fr-FR") : ""),
    ].join(",");
  });

  // \uFEFF is UTF-8 Byte Order Mark so Excel opens French characters correctly
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const fileName = `export_projets_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(csvContent);
}

// Export all projects as PDF
export async function exportProjectsPDF(req, res) {
  const projects = await Project.find()
    .sort({ createdAt: -1 })
    .populate("contractor", CONTRACTOR_FIELDS);

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    info: {
      Title: "Rapport des Projets Solaires",
      Author: "ADVANCED Solar Solutions",
    },
  });

  const fileName = `export_projets_${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  doc.pipe(res);

  // HEADER BANNER
  doc.rect(40, 40, 515, 60).fill("#1e293b");
  doc.fillColor("#ffffff").fontSize(18).text("ADVANCED SOLAR SOLUTIONS", 55, 52, { bold: true });
  doc.fontSize(10).fillColor("#94a3b8").text("Rapport d'exportation des projets", 55, 76);
  doc.fontSize(9).fillColor("#cbd5e1").text(
    `Généré le: ${new Date().toLocaleDateString("fr-FR")}`,
    370,
    76,
    { width: 170, align: "right" }
  );

  // SUMMARY STATS
  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "En cours").length;
  const completed = projects.filter((p) => p.status === "Complété").length;
  const pending = projects.filter((p) => p.status === "En attente").length;

  let y = 115;
  doc.rect(40, y, 515, 40).fill("#f8fafc");
  doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, y, 515, 40).stroke();

  doc.fillColor("#0f172a").fontSize(10);
  doc.text(`Total: ${total}`, 55, y + 14, { bold: true });
  doc.fillColor("#2563eb").text(`En cours: ${inProgress}`, 175, y + 14);
  doc.fillColor("#059669").text(`Complétés: ${completed}`, 290, y + 14);
  doc.fillColor("#d97706").text(`En attente: ${pending}`, 415, y + 14);

  y += 55;

  // PROJECTS LIST
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];

    // New page if space runs out
    if (y > 700) {
      doc.addPage();
      y = 45;
    }

    const cardHeight = 98;
    doc.rect(40, y, 515, cardHeight).fill("#ffffff");
    doc.strokeColor("#e2e8f0").lineWidth(1).rect(40, y, 515, cardHeight).stroke();

    // Top status indicator bar
    const statusColor =
      p.status === "Complété"
        ? "#10b981"
        : p.status === "En cours"
        ? "#3b82f6"
        : "#f59e0b";
    doc.rect(40, y, 515, 3).fill(statusColor);

    // Title & Status
    doc.fillColor("#0f172a").fontSize(11).text(p.name, 55, y + 10, { bold: true, width: 360 });
    doc.fillColor(statusColor).fontSize(9.5).text(`[ ${p.status} ]`, 420, y + 10, { width: 120, align: "right" });

    // Meta details (Contractor, Date)
    doc.fillColor("#64748b").fontSize(8.5);
    const contractorName = p.contractor?.nom || "Aucun contracteur";
    doc.text(`Contracteur: ${contractorName}  |  Date: ${p.date || "—"}`, 55, y + 27);

    // Description
    doc.fillColor("#334155").fontSize(8.5);
    const rawDesc = p.description || "Aucune note.";
    const truncatedDesc = rawDesc.length > 200 ? rawDesc.slice(0, 197) + "..." : rawDesc;
    doc.text(truncatedDesc, 55, y + 42, { width: 485, lineGap: 2 });

    // Attachments summary
    const filesCount = p.files ? p.files.length : 0;
    const imagesCount = p.images ? p.images.length : 0;
    doc.fillColor("#94a3b8").fontSize(8);
    doc.text(
      `Fichiers joints: ${filesCount} document(s)  •  ${imagesCount} image(s)/photo(s)`,
      55,
      y + 78
    );

    y += cardHeight + 12;
  }

  doc.end();
}

export async function updateProjectInvoice(req, res) {
  const { isInvoiced, invoiceStatus, invoiceNumber, invoiceDate, invoiceAmount, invoiceNotes } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (isInvoiced !== undefined) project.isInvoiced = Boolean(isInvoiced);
  if (invoiceStatus !== undefined) project.invoiceStatus = invoiceStatus;
  if (invoiceNumber !== undefined) project.invoiceNumber = String(invoiceNumber).trim();
  if (invoiceDate !== undefined) project.invoiceDate = invoiceDate;
  if (invoiceAmount !== undefined) project.invoiceAmount = Number(invoiceAmount) || 0;
  if (invoiceNotes !== undefined) project.invoiceNotes = invoiceNotes;

  await project.save();
  await project.populate("contractor", CONTRACTOR_FIELDS);

  res.json(project);
}
