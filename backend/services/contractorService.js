import Contractor from "../models/Contractor.js";
import Project from "../models/Project.js";
import mongoose from "mongoose";

export async function getAllContractors() {
  const contractors = await Contractor.find().sort({ nom: 1 }).lean();

  // Aggregate project count per contractor
  const counts = await Project.aggregate([
    { $match: { contractor: { $ne: null } } },
    { $group: { _id: "$contractor", count: { $sum: 1 } } },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    if (c._id) {
      countMap[c._id.toString()] = c.count;
    }
  });

  return contractors.map((c) => ({
    ...c,
    projectCount: countMap[c._id.toString()] || 0,
  }));
}

export async function getContractorById(id) {
  const contractor = await Contractor.findById(id).lean();
  if (!contractor) return null;

  const projectCount = await Project.countDocuments({ contractor: id });
  return { ...contractor, projectCount };
}

export async function getContractorProjects(contractorId) {
  if (!mongoose.Types.ObjectId.isValid(contractorId)) {
    return [];
  }

  return Project.find({ contractor: contractorId })
    .select("name description status date priority submittedDate serviceType pmName drafterName createdAt")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createContractor({ nom }) {
  const contractor = await Contractor.create({ nom });
  return { ...contractor.toObject(), projectCount: 0 };
}

export async function updateContractor(id, { nom }) {
  const updated = await Contractor.findByIdAndUpdate(
    id,
    { nom },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) return null;

  const projectCount = await Project.countDocuments({ contractor: id });
  return { ...updated, projectCount };
}

export async function deleteContractor(id) {
  return Contractor.findByIdAndDelete(id);
}
