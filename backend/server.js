import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from current dir or backend dir
dotenv.config();
dotenv.config({ path: path.join(__dirname, ".env") });

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import contractorRoutes from "./routes/contractorRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workflowStatusRoutes from "./routes/workflowStatusRoutes.js";
import fieldLabelRoutes from "./routes/fieldLabelRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import customVariableRoutes from "./routes/customVariableRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startDeadlineWatcher } from "./services/deadlineWatcherService.js";
import { ensureProjectProcessingFirst } from "./controllers/workflowStatusController.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Serve static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workflow-statuses", workflowStatusRoutes);
app.use("/api/field-labels", fieldLabelRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/custom-variables", customVariableRoutes);

// Serve static frontend in production or if dist exists
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

// Fallback to index.html for React Router (e.g. /admin, /)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

import User from "./models/User.js";
import CustomVariable from "./models/CustomVariable.js";

async function ensureSuperAdmin() {
  try {
    const email = "wa.bjaoui@gmail.com";
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        name: "Wassim Bjaoui",
        email,
        password: "wassimADV2026",
        role: "admin",
      });
      console.log("👑 Super Admin (wa.bjaoui@gmail.com) initialisé avec succès");
    }
  } catch (err) {
    console.error("Super Admin check error:", err.message);
  }
}

async function ensureDefaultCustomVariables() {
  try {
    const totalCount = await CustomVariable.countDocuments();
    if (totalCount === 0) {
      await CustomVariable.create({
        name: "Adresse",
        key: "adresse",
        type: "string",
        order: 0,
        createdBy: "System",
      });
      console.log("📍 Variable 'Adresse' initialisée avec succès");
    }
  } catch (err) {
    console.error("Custom variable check error:", err.message);
  }
}

connectDB()
  .then(async () => {
    await ensureSuperAdmin();
    await ensureDefaultCustomVariables();
    await ensureProjectProcessingFirst();
    startDeadlineWatcher(15);
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });
