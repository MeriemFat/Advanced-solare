import WorkflowStatus from "../models/WorkflowStatus.js";

const DEFAULT_PLAN_SET_STATUSES = [
  {
    name: "Project Processing",
    key: "Project Processing",
    serviceType: "Plan Set Design",
    color: "#d97706",
    badgeColor: "#d97706",
    lightBg: "#fef3c7",
    borderColor: "#fde68a",
    headerBg: "#fffbeb",
    icon: "⚡",
    emptyText: "No projects processing",
    yellowThresholdHours: 48,
    redThresholdHours: 72,
    order: 0,
    isActive: true,
  },
  {
    name: "Change Requests",
    key: "Change Requests",
    serviceType: "Plan Set Design",
    color: "#e11d48",
    badgeColor: "#e11d48",
    lightBg: "#fff1f2",
    borderColor: "#fecdd3",
    headerBg: "#fff1f2",
    icon: "🔄",
    emptyText: "No change requests",
    yellowThresholdHours: 24,
    redThresholdHours: 48,
    order: 1,
    isActive: true,
  },
  {
    name: "Project initiation & Discovery",
    key: "Project initiation & Discovery",
    serviceType: "Plan Set Design",
    color: "#2563eb",
    badgeColor: "#2563eb",
    lightBg: "#eff6ff",
    borderColor: "#bfdbfe",
    headerBg: "#f0f7ff",
    icon: "🚀",
    emptyText: "No projects in initiation",
    yellowThresholdHours: 24,
    redThresholdHours: 48,
    order: 2,
    isActive: true,
  },
  {
    name: "QA Delivery",
    key: "QA Delivery",
    serviceType: "Plan Set Design",
    color: "#7c3aed",
    badgeColor: "#7c3aed",
    lightBg: "#f5f3ff",
    borderColor: "#ddd6fe",
    headerBg: "#faf5ff",
    icon: "🔍",
    emptyText: "No projects in QA Delivery",
    yellowThresholdHours: 24,
    redThresholdHours: 48,
    order: 3,
    isActive: true,
  },
  {
    name: "Awaiting Client Response",
    key: "Awaiting Client Response",
    serviceType: "Plan Set Design",
    color: "#ea580c",
    badgeColor: "#ea580c",
    lightBg: "#ffedd5",
    borderColor: "#fed7aa",
    headerBg: "#fff7ed",
    icon: "⏳",
    emptyText: "No pending client responses",
    yellowThresholdHours: 72,
    redThresholdHours: 120,
    order: 4,
    isActive: true,
  },
  {
    name: "on Hold/Stuck",
    key: "on Hold/Stuck",
    serviceType: "Plan Set Design",
    color: "#dc2626",
    badgeColor: "#dc2626",
    lightBg: "#fee2e2",
    borderColor: "#fca5a5",
    headerBg: "#fef2f2",
    icon: "⛔",
    emptyText: "No projects on hold",
    yellowThresholdHours: 48,
    redThresholdHours: 96,
    order: 5,
    isActive: true,
  },
  {
    name: "Commercial",
    key: "Commercial",
    serviceType: "Plan Set Design",
    color: "#0d9488",
    badgeColor: "#0d9488",
    lightBg: "#f0fdfa",
    borderColor: "#99f6e4",
    headerBg: "#f0fdfa",
    icon: "🏢",
    emptyText: "No commercial projects",
    yellowThresholdHours: 72,
    redThresholdHours: 144,
    order: 6,
    isActive: true,
  },
  {
    name: "Automations",
    key: "Automations",
    serviceType: "Plan Set Design",
    color: "#4f46e5",
    badgeColor: "#4f46e5",
    lightBg: "#eef2ff",
    borderColor: "#c7d2fe",
    headerBg: "#eef2ff",
    icon: "🤖",
    emptyText: "No automated tasks",
    yellowThresholdHours: 24,
    redThresholdHours: 48,
    order: 7,
    isActive: true,
  },
  {
    name: "Completed",
    key: "Completed",
    serviceType: "Plan Set Design",
    color: "#10b981",
    badgeColor: "#10b981",
    lightBg: "#ecfdf5",
    borderColor: "#a7f3d0",
    headerBg: "#f0fdf4",
    icon: "✅",
    emptyText: "No completed projects",
    yellowThresholdHours: 999999, // Completed does not expire
    redThresholdHours: 999999,
    order: 8,
    isActive: true,
  },
];

// Helper to ensure default statuses exist for a service
export async function ensureDefaultStatuses(serviceType = "Plan Set Design") {
  const count = await WorkflowStatus.countDocuments({ serviceType });
  if (count === 0 && serviceType === "Plan Set Design") {
    await WorkflowStatus.insertMany(DEFAULT_PLAN_SET_STATUSES);
  }
}

// Helper to ensure "Project Processing" is placed at the top (order: 0)
export async function ensureProjectProcessingFirst(serviceType = "Plan Set Design") {
  try {
    const processing = await WorkflowStatus.findOne({ serviceType, key: "Project Processing" });
    if (processing && processing.order !== 0) {
      const allStatuses = await WorkflowStatus.find({ serviceType }).sort({ order: 1 });
      const reordered = [
        processing._id,
        ...allStatuses.filter((s) => s._id.toString() !== processing._id.toString()).map((s) => s._id),
      ];
      const bulkOps = reordered.map((id, index) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { order: index } },
        },
      }));
      await WorkflowStatus.bulkWrite(bulkOps);
      console.log(`📌 [WorkflowStatus] "Project Processing" placed at index 0 for ${serviceType}`);
    }
  } catch (err) {
    console.error("Error ensuring Project Processing first:", err.message);
  }
}

// GET /api/workflow-statuses?serviceType=...
export async function getWorkflowStatuses(req, res) {
  try {
    const serviceType = req.query.serviceType || "Plan Set Design";
    await ensureDefaultStatuses(serviceType);
    await ensureProjectProcessingFirst(serviceType);

    const statuses = await WorkflowStatus.find({ serviceType, isActive: true }).sort({ order: 1 });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error fetching workflow statuses" });
  }
}

// POST /api/workflow-statuses
export async function createWorkflowStatus(req, res) {
  try {
    const {
      name,
      key,
      serviceType = "Plan Set Design",
      color = "#3b82f6",
      lightBg = "#eff6ff",
      borderColor = "#bfdbfe",
      headerBg = "#f8fafc",
      icon = "📌",
      emptyText = "No projects in this stage",
      yellowThresholdHours = 24,
      redThresholdHours = 48,
      order,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Status name is required" });
    }

    const statusKey = key && key.trim() ? key.trim() : name.trim();

    // Check duplicate
    const existing = await WorkflowStatus.findOne({ serviceType, key: statusKey });
    if (existing) {
      return res.status(400).json({ message: `A status with key "${statusKey}" already exists in ${serviceType}` });
    }

    // Determine order
    let statusOrder = order;
    if (statusOrder === undefined) {
      const highest = await WorkflowStatus.findOne({ serviceType }).sort({ order: -1 });
      statusOrder = highest ? highest.order + 1 : 0;
    }

    const created = await WorkflowStatus.create({
      name: name.trim(),
      key: statusKey,
      serviceType,
      color,
      badgeColor: color,
      lightBg,
      borderColor,
      headerBg,
      icon,
      emptyText,
      yellowThresholdHours: Number(yellowThresholdHours) || 24,
      redThresholdHours: Number(redThresholdHours) || 48,
      order: statusOrder,
      isActive: true,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error creating workflow status" });
  }
}

// PUT /api/workflow-statuses/:id
export async function updateWorkflowStatus(req, res) {
  try {
    const { id } = req.params;
    const allowed = [
      "name",
      "color",
      "badgeColor",
      "lightBg",
      "borderColor",
      "headerBg",
      "icon",
      "emptyText",
      "yellowThresholdHours",
      "redThresholdHours",
      "order",
      "isActive",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (updates.color && !updates.badgeColor) {
      updates.badgeColor = updates.color;
    }

    const updated = await WorkflowStatus.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Workflow status not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message || "Error updating workflow status" });
  }
}

// DELETE /api/workflow-statuses/:id
export async function deleteWorkflowStatus(req, res) {
  try {
    const { id } = req.params;
    const deleted = await WorkflowStatus.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Workflow status not found" });
    }
    res.json({ message: "Workflow status deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error deleting workflow status" });
  }
}

// POST /api/workflow-statuses/reorder
export async function reorderWorkflowStatuses(req, res) {
  try {
    const { statusIds } = req.body; // array of IDs in order
    if (!Array.isArray(statusIds)) {
      return res.status(400).json({ message: "statusIds array is required" });
    }

    const bulkOps = statusIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await WorkflowStatus.bulkWrite(bulkOps);
    res.json({ message: "Statuses reordered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error reordering workflow statuses" });
  }
}
