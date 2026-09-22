import mongoose from "mongoose";

const fieldLabelSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    defaultLabel: { type: String, required: true, trim: true },
    customLabel: { type: String, default: "", trim: true },
    category: { type: String, default: "General", trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("FieldLabel", fieldLabelSchema);
