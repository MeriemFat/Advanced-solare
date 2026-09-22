import CustomVariable from "../models/CustomVariable.js";
import Project from "../models/Project.js";

function slugifyKey(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `var_${Date.now()}`;
}

export async function getCustomVariables(req, res) {
  try {
    const variables = await CustomVariable.find().sort({ order: 1, createdAt: 1 });
    res.json(variables);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to fetch custom variables" });
  }
}

export async function createCustomVariable(req, res) {
  try {
    const { name, type = "string" } = req.body;
    const trimmedName = (name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Variable name is required" });
    }

    if (!["string", "number", "date"].includes(type)) {
      return res.status(400).json({ message: "Invalid type. Must be string, number, or date" });
    }

    // Check duplicate name
    const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await CustomVariable.findOne({
      name: { $regex: new RegExp(`^${escaped}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ message: `A variable named "${trimmedName}" already exists.` });
    }

    // Generate unique key
    let candidateKey = slugifyKey(trimmedName);
    let counter = 1;
    while (await CustomVariable.findOne({ key: candidateKey })) {
      candidateKey = `${slugifyKey(trimmedName)}_${counter++}`;
    }

    const count = await CustomVariable.countDocuments();

    const variable = await CustomVariable.create({
      name: trimmedName,
      key: candidateKey,
      type,
      order: count,
      createdBy: req.user?.name || "Admin",
    });

    res.status(201).json(variable);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create custom variable" });
  }
}

export async function updateCustomVariable(req, res) {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const trimmedName = (name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ message: "Variable name is required" });
    }

    const variable = await CustomVariable.findById(id);
    if (!variable) {
      return res.status(404).json({ message: "Variable not found" });
    }

    // Check duplicate name on other variables
    const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await CustomVariable.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escaped}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ message: `A variable named "${trimmedName}" already exists.` });
    }

    variable.name = trimmedName;
    if (type && ["string", "number", "date"].includes(type)) {
      variable.type = type;
    }

    await variable.save();
    res.json(variable);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update custom variable" });
  }
}

export async function deleteCustomVariable(req, res) {
  try {
    const variable = await CustomVariable.findByIdAndDelete(req.params.id);
    if (!variable) {
      return res.status(404).json({ message: "Variable not found" });
    }

    // Clean up this custom field key from all projects
    try {
      await Project.updateMany(
        {},
        { $unset: { [`customFields.${variable.key}`]: "" } }
      );
    } catch (cleanErr) {
      console.error("Error removing custom field from projects:", cleanErr);
    }

    res.json({ message: "Custom variable deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete custom variable" });
  }
}
