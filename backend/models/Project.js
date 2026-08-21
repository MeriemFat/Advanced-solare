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
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const projectCommentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, default: "Admin" },
    text: { type: String, required: true },
    date: { type: String, default: () => new Date().toLocaleDateString("fr-FR") },
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
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["En attente", "En cours", "Complété"],
      default: "En attente",
    },
    date: { type: String, required: true },
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: "Contractor", default: null },
    files: { type: [projectFileSchema], default: [] },
    images: { type: [projectImageSchema], default: [] },
    comments: { type: [projectCommentSchema], default: [] },
    links: { type: [projectLinkSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
