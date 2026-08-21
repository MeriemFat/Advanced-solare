import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectFilesDir = path.resolve(__dirname, "..", "uploads", "projects");
const projectImagesDir = path.resolve(__dirname, "..", "uploads", "images");

[projectFilesDir, projectImagesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for project files (documents, pdfs, etc.)
const filesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectFilesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

// Storage for project images
const imagesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, projectImagesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: .${ext}`), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|svg|bmp|avif|heic/;
  const ext = path.extname(file.originalname).toLowerCase().replace(".", "");

  if (allowedExtensions.test(ext) || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error(`Seuls les formats d'image sont autorisés (jpeg, jpg, png, gif, webp, svg, avif, etc.): .${ext}`), false);
  }
};

export const uploadProjectFileMiddleware = multer({
  storage: filesStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter,
});

export const uploadProjectImageMiddleware = multer({
  storage: imagesStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: imageFilter,
});
