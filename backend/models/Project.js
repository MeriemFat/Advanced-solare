import mongoose from "mongoose";

const projectFileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    mimetype: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectImageSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    mimetype: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const commentReplySchema = new mongoose.Schema(
  {
    author: { type: String, required: true, default: "Admin" },
    text: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleDateString("fr-FR") },
    isEdited: { type: Boolean, default: false },
    updatedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectCommentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, default: "Admin" },
    text: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleDateString("fr-FR") },
    isEdited: { type: Boolean, default: false },
    updatedAt: { type: Date },
    replies: { type: [commentReplySchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      default: "Project initiation & Discovery",
      trim: true,
    },
    serviceType: { type: String, default: "Plan Set Design", trim: true },
    statusUpdatedAt: { type: Date, default: Date.now },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: "Admin" },
      },
    ],
    date: { type: String, required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "Contractor", default: null },
    priority: { type: String, default: "Medium" },
    projectType: {
      type: [String],
      default: [],
      set: (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
        if (typeof val === "string") {
          const trimmed = val.trim();
          if (!trimmed) return [];
          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
            } catch (e) {}
          }
          if (trimmed.includes(",")) return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
          return [trimmed];
        }
        return [];
      },
    },
    idReview: { type: String, default: "" },
    updates: { type: String, default: "" },
    pmName: { type: String, default: "" },
    pmEmails: { type: String, default: "" },
    peerReview: { type: String, default: "" },
    drafterName: { type: String, default: "" },
    drafterEmails: { type: String, default: "" },
    submittedDate: { type: String, default: "" },
    rfiStatus: { type: String, default: "" },
    pmStatus: { type: String, default: "" },
    draftingStatus: { type: String, default: "" },
    qaAndDeliveryStatus: { type: String, default: "" },
    projectSs: { type: String, default: "" },
    seTime: { type: String, default: "" },
    structEngi: { type: String, default: "" },
    files: { type: [projectFileSchema], default: [] },
    images: { type: [projectImageSchema], default: [] },
    comments: { type: [projectCommentSchema], default: [] },
    links: { type: [projectLinkSchema], default: [] },
    customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
    isInvoiced: { type: Boolean, default: false },
    invoiceStatus: { type: String, default: "Not Invoiced" },
    invoiceNumber: { type: String, default: "" },
    invoiceDate: { type: String, default: "" },
    invoiceAmount: { type: Number, default: 0 },
    invoiceNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
