import * as contractorService from "../services/contractorService.js";

export async function getContractors(req, res) {
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
  const { nom } = req.body;
  const contractor = await contractorService.createContractor({ nom });
  res.status(201).json(contractor);
}

export async function updateContractor(req, res) {
  const { nom } = req.body;
  const contractor = await contractorService.updateContractor(req.params.id, { nom });
  if (!contractor) {
    return res.status(404).json({ message: "Contracteur introuvable" });
  }
  res.json(contractor);
}

export async function deleteContractor(req, res) {
  const contractor = await contractorService.deleteContractor(req.params.id);
  if (!contractor) {
    return res.status(404).json({ message: "Contracteur introuvable" });
  }
  res.json({ message: "Contracteur supprimé" });
}
