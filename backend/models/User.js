import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "subadmin", "client"],
      default: "client",
    },
    permissions: {
      // Modules / Vues visibles
      canViewProjects: { type: Boolean, default: true },
      canViewContractors: { type: Boolean, default: true },
      canViewInvoices: { type: Boolean, default: true },
      canViewInterconnection: { type: Boolean, default: true },

      // Périmètre des projets affichés
      projectAccess: {
        type: String,
        enum: ["all", "assigned"],
        default: "all",
      },

      // Ce qu'il peut faire (Actions)
      canCreateProjects: { type: Boolean, default: true },
      canEditProjects: { type: Boolean, default: true },
      canDeleteProjects: { type: Boolean, default: false },
      canExportProjects: { type: Boolean, default: true },
      canManageContractors: { type: Boolean, default: true },
      canEditInvoices: { type: Boolean, default: true },
      canEditInterconnection: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
