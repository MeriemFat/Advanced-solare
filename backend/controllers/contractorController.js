import * as contractorService from "../services/contractorService.js";
import User from "../models/User.js";

export async function getContractors(req, res) {
  if (req.user && req.user.role === "subadmin") {
    const userDoc = await User.findById(req.user.id).select("permissions");
    if (userDoc?.permissions && userDoc.permissions.canViewContractors === false) {
      return res.json([]);
    }
  }
  const contractors = await contractorService.getAllContractors();
  res.json(contractors);
}

export async function getContractor(req, res) {
  const contractor = await contractorService.getContractorById(req.params.id);
  if (!contractor) {
    return res.status(404).json({ message: "Contracteur introuvable" });
  }
  res.json(contractor);
}

export async function createContractor(req, res) {
  if (req.user && req.user.role === "subadmin") {
    const userDoc = await User.findById(req.user.id).select("permissions");
    if (userDoc?.permissions && userDoc.permissions.canManageContractors === false) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation de créer des contracteurs" });
    }
  }
  const { nom } = req.body;
  const contractor = await contractorService.createContractor({ nom });
  res.status(201).json(contractor);
}

export async function updateContractor(req, res) {
  if (req.user && req.user.role === "subadmin") {
    const userDoc = await User.findById(req.user.id).select("permissions");
    if (userDoc?.permissions && userDoc.permissions.canManageContractors === false) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation de modifier des contracteurs" });
    }
  }
  const { nom } = req.body;
  const contractor = await contractorService.updateContractor(req.params.id, { nom });
  if (!contractor) {
    return res.status(404).json({ message: "Contracteur introuvable" });
  }
  res.json(contractor);
}

export async function deleteContractor(req, res) {
  if (req.user && req.user.role === "subadmin") {
    const userDoc = await User.findById(req.user.id).select("permissions");
    if (userDoc?.permissions && userDoc.permissions.canManageContractors === false) {
      return res.status(403).json({ message: "Vous n'avez pas l'autorisation de supprimer des contracteurs" });
    }
  }
  const contractor = await contractorService.deleteContractor(req.params.id);
  if (!contractor) {
    return res.status(404).json({ message: "Contracteur introuvable" });
  }
  res.json({ message: "Contracteur supprimé" });
}

export async function getContractorProjects(req, res) {
  const projects = await contractorService.getContractorProjects(req.params.id);
  res.json(projects);
}
