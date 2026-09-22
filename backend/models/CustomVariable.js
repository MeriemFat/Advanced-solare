import mongoose from "mongoose";

const customVariableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true },
    type: {
      type: String,
      enum: ["string", "number", "date"],
      default: "string",
    },
    order: { type: Number, default: 0 },
    createdBy: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

customVariableSchema.index({ order: 1, createdAt: 1 });

export default mongoose.model("CustomVariable", customVariableSchema);
