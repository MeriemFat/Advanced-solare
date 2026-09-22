import mongoose from "mongoose";

const workflowStatusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    serviceType: { type: String, default: "Plan Set Design", trim: true },
    color: { type: String, default: "#3b82f6" },
    badgeColor: { type: String, default: "#3b82f6" },
    lightBg: { type: String, default: "#eff6ff" },
    borderColor: { type: String, default: "#bfdbfe" },
    headerBg: { type: String, default: "#f8fafc" },
    icon: { type: String, default: "📌" },
    emptyText: { type: String, default: "No projects in this stage" },
    yellowThresholdHours: { type: Number, default: 24 }, // Threshold 1: warning deadline (Yellow highlight)
    redThresholdHours: { type: Number, default: 48 },    // Threshold 2: critical overdue (Red highlight)
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workflowStatusSchema.index({ serviceType: 1, order: 1 });
workflowStatusSchema.index({ serviceType: 1, key: 1 }, { unique: true });

export default mongoose.model("WorkflowStatus", workflowStatusSchema);
