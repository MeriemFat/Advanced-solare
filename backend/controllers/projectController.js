import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import PDFDocument from "pdfkit";
import Project from "../models/Project.js";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTOR_FIELDS = "nom";

export async function getProjects(req, res) {
  const projects = await Project.find()
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
  const { name, description, status, date, contractor } = req.body;
  const project = await Project.create({
    name,
    description,
    status,
    date,
    contractor: contractor || null,
  });
  await project.populate("contractor", CONTRACTOR_FIELDS);
  res.status(201).json(project);
}

export async function updateProject(req, res) {
  const { name, description, status, date, contractor } = req.body;
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { name, description, status, date, contractor: contractor || null },
    { new: true, runValidators: true }
  ).populate("contractor", CONTRACTOR_FIELDS);

  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }
  res.json(project);
}

export async function deleteProject(req, res) {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) {
    return res.status(404).json({ message: "Projet introuvable" });
  }

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

  res.status(201).json({
    message: "Commentaire ajouté avec succès",
    comment: project.comments[project.comments.length - 1],
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

  res.status(201).json({
    message: "Réponse ajoutée avec succès",
    reply: commentItem.replies[commentItem.replies.length - 1],
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
    "Date",
    "Contracteur",
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
      escapeCSV(p.date),
      escapeCSV(p.contractor?.nom || "Non assigné"),
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
