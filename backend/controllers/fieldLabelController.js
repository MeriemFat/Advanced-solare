import FieldLabel from "../models/FieldLabel.js";

export const DEFAULT_FIELD_LABELS = [
  { key: "name", defaultLabel: "Project Title", category: "General Info", description: "Primary project name displayed across all views" },
  { key: "description", defaultLabel: "Project Description", category: "General Info", description: "Technical specs, equipment, notes" },
  { key: "priority", defaultLabel: "Priority", category: "General Info", description: "Urgent, High, Medium, Low urgency" },
  { key: "projectType", defaultLabel: "Project Type", category: "General Info", description: "Residential PV, Commercial, ESS, etc." },
  { key: "contractor", defaultLabel: "Contractor", category: "General Info", description: "Assigned partner or client contractor" },
  { key: "status", defaultLabel: "Board Status", category: "General Info", description: "Current lifecycle pipeline stage" },
  { key: "submittedDate", defaultLabel: "Submitted Date", category: "General Info", description: "Date initial files were submitted" },
  { key: "date", defaultLabel: "Target Date", category: "General Info", description: "Target completion or deadline date" },
  { key: "timeSpent", defaultLabel: "Time Spent", category: "General Info", description: "Time elapsed on the project so far (Today - Submitted Date)" },
  { key: "targetDuration", defaultLabel: "Target Duration", category: "General Info", description: "Total planned project duration (Target Date - Submitted Date)" },

  { key: "pmName", defaultLabel: "PM Name", category: "Team & Contacts", description: "Project Manager in charge" },
  { key: "pmEmails", defaultLabel: "PM Emails", category: "Team & Contacts", description: "Email contact for the Project Manager" },
  { key: "drafterName", defaultLabel: "Drafter Name", category: "Team & Contacts", description: "CAD Designer or Drafter assigned" },
  { key: "drafterEmails", defaultLabel: "Drafter Emails", category: "Team & Contacts", description: "Email contact for the Drafter" },
  { key: "structEngi", defaultLabel: "Structural Engineer / Firm", category: "Team & Contacts", description: "Structural PE stamp or firm" },

  { key: "pmStatus", defaultLabel: "PM Status", category: "Statuses & Reviews", description: "Internal Project Management review status" },
  { key: "draftingStatus", defaultLabel: "Drafting Status", category: "Statuses & Reviews", description: "CAD drawing preparation status" },
  { key: "qaAndDeliveryStatus", defaultLabel: "QA & Delivery Status", category: "Statuses & Reviews", description: "Quality Assurance & final delivery stage" },
  { key: "idReview", defaultLabel: "I&D Review", category: "Statuses & Reviews", description: "Initiation & Discovery review stage" },
  { key: "peerReview", defaultLabel: "Peer Review", category: "Statuses & Reviews", description: "Internal peer technical review" },
  { key: "rfiStatus", defaultLabel: "RFI Status", category: "Statuses & Reviews", description: "Request For Information status" },

  { key: "seTime", defaultLabel: "SE Time / Turnaround", category: "Engineering & Updates", description: "Structural engineering turnaround time" },
  { key: "projectSs", defaultLabel: "Site Survey (SS)", category: "Engineering & Updates", description: "Site survey photos link or technical notes" },
  { key: "updates", defaultLabel: "Updates / Latest Notes", category: "Engineering & Updates", description: "Latest progress notes and communications" },
];

export async function ensureDefaultFieldLabels() {
  const count = await FieldLabel.countDocuments();
  if (count === 0) {
    await FieldLabel.insertMany(DEFAULT_FIELD_LABELS);
  }
}

// GET /api/field-labels
export async function getFieldLabels(req, res) {
  try {
    await ensureDefaultFieldLabels();
    const labels = await FieldLabel.find().sort({ category: 1, key: 1 });
    
    // Return both detailed array and convenient key-value map
    const dictionary = {};
    labels.forEach((item) => {
      dictionary[item.key] = item.customLabel && item.customLabel.trim() ? item.customLabel.trim() : item.defaultLabel;
    });

    res.json({
      items: labels,
      dictionary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error fetching field labels" });
  }
}

// PUT /api/field-labels (Bulk update custom labels)
export async function updateFieldLabels(req, res) {
  try {
    const { updates } = req.body; // e.g. { "drafterName": "CAD Designer", "seTime": "Turnaround" }
    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ message: "Updates object is required" });
    }

    const bulkOps = Object.entries(updates).map(([key, customLabel]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { customLabel: typeof customLabel === "string" ? customLabel.trim() : "" } },
        upsert: false,
      },
    }));

    if (bulkOps.length > 0) {
      await FieldLabel.bulkWrite(bulkOps);
    }

    const updated = await FieldLabel.find().sort({ category: 1, key: 1 });
    const dictionary = {};
    updated.forEach((item) => {
      dictionary[item.key] = item.customLabel && item.customLabel.trim() ? item.customLabel.trim() : item.defaultLabel;
    });

    res.json({
      message: "Field labels updated successfully",
      items: updated,
      dictionary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error updating field labels" });
  }
}

// POST /api/field-labels/reset
export async function resetFieldLabels(req, res) {
  try {
    await FieldLabel.updateMany({}, { $set: { customLabel: "" } });
    const updated = await FieldLabel.find().sort({ category: 1, key: 1 });
    const dictionary = {};
    updated.forEach((item) => {
      dictionary[item.key] = item.defaultLabel;
    });

    res.json({
      message: "Field labels reset to defaults",
      items: updated,
      dictionary,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Error resetting field labels" });
  }
}
