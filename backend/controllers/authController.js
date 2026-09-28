import jwt from "jsonwebtoken";
import User from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function getUserPermissions(user) {
  if (user.role === "admin") {
    return {
      canViewProjects: true,
      canViewContractors: true,
      canViewInvoices: true,
      canViewInterconnection: true,
      projectAccess: "all",
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
      canExportProjects: true,
      canManageContractors: true,
      canEditInvoices: true,
      canEditInterconnection: true,
    };
  }

  const p = user.permissions || {};
  return {
    canViewProjects: p.canViewProjects ?? true,
    canViewContractors: p.canViewContractors ?? true,
    canViewInvoices: p.canViewInvoices ?? true,
    canViewInterconnection: p.canViewInterconnection ?? true,
    projectAccess: p.projectAccess || "all",
    canCreateProjects: p.canCreateProjects ?? true,
    canEditProjects: p.canEditProjects ?? true,
    canDeleteProjects: p.canDeleteProjects ?? false,
    canExportProjects: p.canExportProjects ?? true,
    canManageContractors: p.canManageContractors ?? true,
    canEditInvoices: p.canEditInvoices ?? true,
    canEditInterconnection: p.canEditInterconnection ?? true,
  };
}

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const user = await User.create({ name, email, password, role });
  const token = signToken(user);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: getUserPermissions(user),
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "No account found with this email" });
  }
  if (!(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: getUserPermissions(user),
    },
  });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user),
  });
}
