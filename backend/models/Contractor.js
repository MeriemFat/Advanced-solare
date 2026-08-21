import mongoose from "mongoose";

const contractorSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Contractor", contractorSchema);
