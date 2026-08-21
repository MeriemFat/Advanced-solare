import Contractor from "../models/Contractor.js";

export async function getAllContractors() {
  return Contractor.find().sort({ createdAt: -1 });
}

export async function getContractorById(id) {
  return Contractor.findById(id);
}

export async function createContractor({ nom }) {
  return Contractor.create({ nom });
}

export async function updateContractor(id, { nom }) {
  return Contractor.findByIdAndUpdate(
    id,
    { nom },
    { new: true, runValidators: true }
  );
}

export async function deleteContractor(id) {
  return Contractor.findByIdAndDelete(id);
}
