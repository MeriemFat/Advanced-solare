import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { FaPlus, FaTrash, FaCheckCircle, FaClock, FaHourglassEnd, FaComment, FaLink, FaFile, FaImage, FaUpload, FaDownload, FaFilePdf, FaFileArchive, FaChevronDown, FaChevronUp, FaReply, FaPaperPlane, FaUserShield, FaCrown, FaSearch, FaTimes, FaEye, FaPencilAlt, FaCog, FaSort, FaSortUp, FaSortDown, FaColumns, FaFileInvoiceDollar, FaNetworkWired } from "react-icons/fa";
import { NotificationCenter } from "./NotificationCenter";
import { CustomVariablesModal } from "./CustomVariablesModal";
import { ManageColumnsModal } from "./ManageColumnsModal";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectFile,
  deleteProjectFile,
  uploadProjectImage,
  deleteProjectImage,
  downloadProjectFile,
  downloadProjectImage,
  addProjectComment,
  updateProjectComment,
  deleteProjectComment,
  addCommentReply,
  updateCommentReply,
  deleteCommentReply,
  addProjectLink,
  deleteProjectLink,
  exportProjectFilesZip,
  exportAllUploadedFilesZip,
  exportProjectsCSV,
  exportProjectsPDF,
  getContractors,
  getWorkflowStatuses,
  createWorkflowStatus,
  updateWorkflowStatus,
  deleteWorkflowStatus,
  getFieldLabels,
  updateFieldLabels,
  getCustomVariables,
  updateCustomVariable,
  deleteCustomVariable,
  type CustomVariable,
  type Contractor,
  type WorkflowStatus,
  getMentionableUsers,
  type SubadminUser,
  getMe,
  type AuthUser,
  type UserPermissions,
} from "../../lib/api";
import { MentionInput } from "./MentionInput";
import Contractors from "./Contractors";
import Subadmins from "./Subadmins";
import Invoices from "./Invoices";
import Interconnection from "./Interconnection";
import "./admin-responsive.css";

type ProjectDetail = {
  id: string;
  name: string;
  description?: string;
  status: string;
  serviceType?: string;
  statusUpdatedAt?: string;
  statusHistory?: Array<{ status: string; changedAt: string; changedBy: string }>;
  date: string;
  contractor: Contractor | null;
  priority?: string;
  projectType?: string[] | string;
  idReview?: string;
  updates?: string;
  pmName?: string;
  pmEmails?: string;
  peerReview?: string;
  drafterName?: string;
  drafterEmails?: string;
  submittedDate?: string;
  rfiStatus?: string;
  pmStatus?: string;
  draftingStatus?: string;
  qaAndDeliveryStatus?: string;
  projectSs?: string;
  seTime?: string;
  structEngi?: string;
  comments: Comment[];
  links: Link[];
  files: FileItem[];
  images: ImageItem[];
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

type CommentReply = {
  id: string | number;
  text: string;
  author: string;
  date: string;
  isEdited?: boolean;
};

type Comment = {
  id: string | number;
  text: string;
  author: string;
  date: string;
  isEdited?: boolean;
  replies: CommentReply[];
};

type Link = {
  id: string | number;
  title: string;
  url: string;
};

type FileItem = {
  id: string | number;
  name: string;
  url: string;
  size?: number;
};

type ImageItem = {
  id: string | number;
  url: string;
  title: string;
  size?: number;
};

export const normalizeStatus = (status?: string): string => {
  if (!status) return "Project initiation & Discovery";
  if (status === "En attente") return "Project initiation & Discovery";
  if (status === "En cours") return "Project Processing";
  if (status === "Complété") return "Completed";
  return status;
};

export const PROJECT_GROUPS = [
  {
    key: "Project Processing",
    title: "Project Processing",
    color: "#2563eb",
    badgeColor: "#3b82f6",
    lightBg: "#eff6ff",
    borderColor: "#bfdbfe",
    headerBg: "#f0f7ff",
    icon: "⚙️",
    emptyText: "No projects in processing",
  },
  {
    key: "Change Requests",
    title: "Change Requests",
    color: "#7c3aed",
    badgeColor: "#8b5cf6",
    lightBg: "#f5f3ff",
    borderColor: "#ddd6fe",
    headerBg: "#faf5ff",
    icon: "🔄",
    emptyText: "No change requests",
  },
  {
    key: "Project initiation & Discovery",
    title: "Project initiation & Discovery",
    color: "#0284c7",
    badgeColor: "#0ea5e9",
    lightBg: "#f0f9ff",
    borderColor: "#bae6fd",
    headerBg: "#f8fafc",
    icon: "🚀",
    emptyText: "No projects in initiation & discovery",
  },
  {
    key: "QA Delivery",
    title: "QA Delivery",
    color: "#0d9488",
    badgeColor: "#14b8a6",
    lightBg: "#f0fdfa",
    borderColor: "#99f6e4",
    headerBg: "#f4fbf9",
    icon: "🎯",
    emptyText: "No projects in QA delivery",
  },
  {
    key: "Awaiting Client Response",
    title: "Awaiting Client Response",
    color: "#d97706",
    badgeColor: "#f59e0b",
    lightBg: "#fffbeb",
    borderColor: "#fde68a",
    headerBg: "#fffdf0",
    icon: "⏳",
    emptyText: "No projects awaiting client response",
  },
  {
    key: "on Hold/Stuck",
    title: "on Hold/Stuck",
    color: "#dc2626",
    badgeColor: "#ef4444",
    lightBg: "#fef2f2",
    borderColor: "#fecaca",
    headerBg: "#fff5f5",
    icon: "🛑",
    emptyText: "No projects on hold or stuck",
  },
  {
    key: "Commercial",
    title: "Commercial",
    color: "#db2777",
    badgeColor: "#ec4899",
    lightBg: "#fdf2f8",
    borderColor: "#fbcfe8",
    headerBg: "#fff1f2",
    icon: "💼",
    emptyText: "No commercial projects",
  },
  {
    key: "Automations",
    title: "Automations",
    color: "#4f46e5",
    badgeColor: "#6366f1",
    lightBg: "#eef2ff",
    borderColor: "#c7d2fe",
    headerBg: "#f5f7ff",
    icon: "🤖",
    emptyText: "No automations projects",
  },
  {
    key: "Completed",
    title: "Completed",
    color: "#059669",
    badgeColor: "#10b981",
    lightBg: "#ecfdf5",
    borderColor: "#a7f3d0",
    headerBg: "#f0fdf4",
    icon: "✅",
    emptyText: "No completed projects",
  },
];

export const PROJECT_TYPES = [
  "Plan Set",
  "Battery+Plans",
  "Client Plans edit engeneering only",
  "ESS only",
  "Interconnection",
  "Layout",
  "Line Diagram only",
  "NEM Line Diagram",
  "Patio Project - no elec",
  "Quote Only ATM",
  "Site Map",
  "SLD only",
  "Utility Sub - TLD/Layout",
] as const;

export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const SORT_OPTIONS = [
  { field: "date", label: "Target Date" },
  { field: "submittedDate", label: "Submitted Date" },
  { field: "timeSpent", label: "Time Spent (Temps passé)" },
  { field: "targetDuration", label: "Target Duration (Durée prévue)" },
  { field: "name", label: "Project Title" },
  { field: "priority", label: "Priority" },
  { field: "status", label: "Board Status" },
  { field: "contractor", label: "Contractor" },
  { field: "projectType", label: "Project Type" },
  { field: "pmName", label: "PM Name" },
  { field: "pmEmails", label: "PM Emails" },
  { field: "drafterName", label: "Drafter Name" },
  { field: "drafterEmails", label: "Drafter Emails" },
  { field: "structEngi", label: "Struct Engi" },
  { field: "seTime", label: "SE Time" },
  { field: "pmStatus", label: "PM Status" },
  { field: "draftingStatus", label: "Drafting Status" },
  { field: "qaAndDeliveryStatus", label: "QA & Delivery Status" },
  { field: "idReview", label: "I&D Review" },
  { field: "peerReview", label: "Peer Review" },
  { field: "rfiStatus", label: "RFI Status" },
  { field: "projectSs", label: "Site Survey (SS)" },
  { field: "updates", label: "Updates / Notes" },
  { field: "files", label: "Files Count" },
  { field: "comments", label: "Comments Count" },
];

export const STRUCT_ENGI_OPTIONS = [
  "Choose",
  "Received",
  "engi question",
  "Not Needed",
  "Waiting for answer",
  "Required",
  "RFQ sent",
  "SE Requested",
  "Not Received",
  "Done",
  "SE Marked up",
  "SE Marked uo",
  "Revision Sent",
];

export function getStructEngiBadgeStyle(val?: string): React.CSSProperties {
  const norm = (val || "").trim().toLowerCase();
  switch (norm) {
    case "received":
      return { background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" };
    case "engi question":
      return { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" };
    case "not needed":
      return { background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" };
    case "waiting for answer":
      return { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" };
    case "required":
      return { background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" };
    case "rfq sent":
      return { background: "#faf5ff", color: "#7c3aed", borderColor: "#e9d5ff" };
    case "se requested":
      return { background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" };
    case "not received":
      return { background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" };
    case "done":
      return { background: "#ecfdf5", color: "#10b981", borderColor: "#6ee7b7" };
    case "se marked up":
    case "se marked uo":
      return { background: "#ecfeff", color: "#0891b2", borderColor: "#a5f3fc" };
    case "revision sent":
      return { background: "#eef2ff", color: "#4f46e5", borderColor: "#c7d2fe" };
    default:
      return { background: "#ffffff", color: "#64748b", borderColor: "#cbd5e1" };
  }
}

export const normalizeProjectTypes = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim()).filter(Boolean);
      } catch (e) {}
    }
    if (trimmed.includes(",")) return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    return [trimmed];
  }
  return [];
};

interface ProjectTypeMultiSelectProps {
  value?: string[] | string;
  onChange: (newValues: string[]) => void;
  compact?: boolean;
  placeholder?: string;
}

export function ProjectTypeMultiSelect({
  value,
  onChange,
  compact = false,
  placeholder = "Select types...",
}: ProjectTypeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTypes = useMemo(() => normalizeProjectTypes(value), [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const allOptions = useMemo(() => {
    const list = [...PROJECT_TYPES];
    selectedTypes.forEach((st) => {
      if (!list.some((pt) => pt.toLowerCase() === st.toLowerCase())) {
        list.push(st as any);
      }
    });
    return list;
  }, [selectedTypes]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const q = searchQuery.toLowerCase();
    return allOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [allOptions, searchQuery]);

  const toggleOption = (opt: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const exists = selectedTypes.some((t) => t.toLowerCase() === opt.toLowerCase());
    let next: string[];
    if (exists) {
      next = selectedTypes.filter((t) => t.toLowerCase() !== opt.toLowerCase());
    } else {
      next = [...selectedTypes, opt];
    }
    onChange(next);
  };

  const removeBadge = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTypes.filter((t) => t.toLowerCase() !== opt.toLowerCase()));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([...allOptions]);
  };

  return (
    <div
      ref={containerRef}
      className="pts-container"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={`pts-trigger ${compact ? "pts-trigger-compact" : ""} ${isOpen ? "pts-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={selectedTypes.join(", ") || placeholder}
      >
        <div className="pts-badges-wrap">
          {selectedTypes.length === 0 ? (
            <span className="pts-placeholder">{placeholder}</span>
          ) : compact ? (
            <>
              <span className="pts-badge" title={selectedTypes[0]}>
                {selectedTypes[0]}
                <button
                  type="button"
                  className="pts-badge-remove"
                  onClick={(e) => removeBadge(selectedTypes[0], e)}
                  title="Remove"
                >
                  ×
                </button>
              </span>
              {selectedTypes.length > 1 && (
                <span
                  className="pts-count-badge"
                  title={selectedTypes.slice(1).join(", ")}
                >
                  +{selectedTypes.length - 1}
                </span>
              )}
            </>
          ) : (
            selectedTypes.map((t) => (
              <span key={t} className="pts-badge" title={t}>
                {t}
                <button
                  type="button"
                  className="pts-badge-remove"
                  onClick={(e) => removeBadge(t, e)}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <span className="pts-chevron">▼</span>
      </div>

      {isOpen && (
        <div className="pts-popover" onClick={(e) => e.stopPropagation()}>
          <div className="pts-search-wrap">
            <input
              type="text"
              className="pts-search-input"
              placeholder="Search type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="pts-actions-bar">
            <span className="pts-selected-count">
              {selectedTypes.length} selected
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="pts-action-btn"
                onClick={handleSelectAll}
              >
                All
              </button>
              {selectedTypes.length > 0 && (
                <button
                  type="button"
                  className="pts-action-btn"
                  style={{ color: "#ef4444" }}
                  onClick={handleClearAll}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="pts-list">
            {filteredOptions.length === 0 ? (
              <div style={{ padding: "8px", fontSize: "11px", color: "#94a3b8", textAlign: "center" }}>
                No matching type
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedTypes.some(
                  (t) => t.toLowerCase() === opt.toLowerCase()
                );
                return (
                  <div
                    key={opt}
                    className={`pts-item ${isSelected ? "pts-item-selected" : ""}`}
                    onClick={() => toggleOption(opt)}
                  >
                    <input
                      type="checkbox"
                      className="pts-checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(opt)}
                    />
                    <span className="pts-item-label" title={opt}>
                      {opt}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface InlineEditableInputProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => boolean | Promise<boolean>;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  titleTooltip?: string;
}

function InlineEditableInput({
  value,
  placeholder,
  onSave,
  style,
  inputStyle,
  titleTooltip,
}: InlineEditableInputProps) {
  const [val, setVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setVal(value);
  }, [value]);

  const handleBlur = async () => {
    setIsFocused(false);
    const trimmed = val.trim();
    if (trimmed !== value) {
      const ok = await onSave(trimmed);
      if (ok === false) {
        setVal(value);
      }
    } else if (val !== value) {
      setVal(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setVal(value);
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={val}
      placeholder={placeholder}
      title={titleTooltip || (val ? val : placeholder)}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setVal(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: isFocused
          ? "1px solid #3b82f6"
          : isHovered
          ? "1px dashed #94a3b8"
          : "1px solid transparent",
        borderRadius: "5px",
        padding: "2px 6px",
        background: isFocused
          ? "#ffffff"
          : isHovered
          ? "rgba(255, 255, 255, 0.9)"
          : "transparent",
        boxShadow: isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.25)" : "none",
        outline: "none",
        cursor: isFocused ? "text" : "pointer",
        transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
        textOverflow: isFocused ? "clip" : "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        ...inputStyle,
        ...style,
      }}
    />
  );
}

export function getPriorityStyle(priority: string = "Medium"): React.CSSProperties {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" };
    case "high":
      return { background: "#ffedd5", color: "#ea580c", border: "1px solid #fdba74" };
    case "low":
      return { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" };
    case "medium":
    default:
      return { background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a" };
  }
}

export type TimelineHighlight = {
  state: "normal" | "yellow" | "red";
  // Temps passé dans le projet (Aujourd'hui - Submitted Date)
  timeSpentHours: number;
  timeSpentDays: number;
  timeSpentLabel: string;
  // Durée prévue du projet (Target Date - Submitted Date)
  plannedDurationHours: number;
  plannedDurationDays: number;
  plannedDurationLabel: string;
  // Aliases de compatibilité
  elapsedHours: number;
  elapsedLabel: string;
  thresholdLabel: string;
  cellBackground: string;
  borderAccent: string;
  badgeBadge: React.ReactNode;
};

function parseSafeDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (!s) return null;

  // Format DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    return new Date(year, month, day);
  }

  // Format YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    return new Date(year, month, day);
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function getProjectTimelineHighlight(
  project: ProjectDetail,
  statusList: WorkflowStatus[] = []
): TimelineHighlight {
  const normStatus = normalizeStatus(project.status);
  const now = new Date();

  // 1. Date de départ : Submitted Date (ou createdAt si absente)
  const startDate = parseSafeDate(project.submittedDate) || parseSafeDate(project.createdAt) || now;
  const targetDate = parseSafeDate(project.date);

  // Si le projet est complété, on arrête le chronomètre du temps passé à sa date d'achèvement
  const isCompleted = normStatus === "Completed" || normStatus === "Complété";
  const endDate = isCompleted
    ? (parseSafeDate(project.statusUpdatedAt) || parseSafeDate(project.updatedAt) || now)
    : now;

  // =========================================================================
  // VARIABLE 1 : TEMPS PASSÉ DANS LE PROJET (Aujourd'hui - Submitted Date)
  // =========================================================================
  const startMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  const diffTimeSpentMs = Math.max(0, endMidnight - startMidnight);
  const timeSpentDays = Math.floor(diffTimeSpentMs / (1000 * 60 * 60 * 24));

  // Calcul d'heures réelles pour les projets récents ou du même jour
  const exactStartTime = startDate.getTime();
  const exactEndTime = endDate.getTime();
  const exactDiffHours = Math.floor(Math.max(0, exactEndTime - exactStartTime) / (1000 * 60 * 60));
  const timeSpentHours = Math.max(timeSpentDays * 24, exactDiffHours);

  let timeSpentLabel = "0d";
  if (timeSpentDays > 0) {
    const remHours = timeSpentHours % 24;
    timeSpentLabel = remHours > 0 ? `${timeSpentDays}d ${remHours}h` : `${timeSpentDays}d`;
  } else if (timeSpentHours > 0) {
    timeSpentLabel = `${timeSpentHours}h`;
  } else {
    timeSpentLabel = "0d";
  }

  // =========================================================================
  // VARIABLE 2 : DURÉE PRÉVUE DU PROJET (Target Date - Submitted Date)
  // =========================================================================
  let plannedDurationHours = 0;
  let plannedDurationDays = 0;
  let plannedDurationLabel = "—";

  if (targetDate) {
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const diffPlannedMs = Math.max(0, targetMidnight - startMidnight);
    plannedDurationHours = Math.round(diffPlannedMs / (1000 * 60 * 60));
    plannedDurationDays = Math.round(diffPlannedMs / (1000 * 60 * 60 * 24));

    if (plannedDurationDays > 0) {
      const remHours = plannedDurationHours % 24;
      plannedDurationLabel = remHours > 0 ? `${plannedDurationDays}d ${remHours}h` : `${plannedDurationDays}d`;
    } else {
      plannedDurationLabel = `${plannedDurationHours}h`;
    }
  }

  const startDisplay = project.submittedDate || "N/A";
  const targetDisplay = project.date || "N/A";

  // Si le statut est complété
  if (isCompleted) {
    return {
      state: "normal",
      timeSpentHours,
      timeSpentDays,
      timeSpentLabel,
      plannedDurationHours,
      plannedDurationDays,
      plannedDurationLabel,
      elapsedHours: timeSpentHours,
      elapsedLabel: `${timeSpentLabel} (Completed)`,
      thresholdLabel: "Completed",
      cellBackground: "transparent",
      borderAccent: "#10b981",
      badgeBadge: (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 7px",
            borderRadius: "6px",
            background: "#ecfdf5",
            color: "#059669",
            fontSize: "11px",
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
          title={`Projet complété ! Temps total passé : ${timeSpentLabel} | Durée prévue : ${plannedDurationLabel}`}
        >
          ✓ {timeSpentLabel}
        </span>
      ),
    };
  }

  // 2. Configuration des seuils du workflow (Yellow & Red) pour le statut actuel
  const statusConfig = statusList?.find(
    (s) =>
      s.key === normStatus ||
      s.name === normStatus ||
      s.key?.toLowerCase() === normStatus.toLowerCase() ||
      s.name?.toLowerCase() === normStatus.toLowerCase()
  );
  const yellowHours = statusConfig?.yellowThresholdHours ?? 24;
  const redHours = statusConfig?.redThresholdHours ?? 48;

  // Temps passé dans le statut actuel (en heures)
  const refDate = project.statusUpdatedAt || project.createdAt;
  let refTime = refDate ? new Date(refDate).getTime() : NaN;
  if (isNaN(refTime)) {
    const parsed = parseSafeDate(project.statusUpdatedAt || project.createdAt);
    refTime = parsed ? parsed.getTime() : Date.now();
  }
  const timeInStageMs = Math.max(0, Date.now() - refTime);
  const hoursInStage = Math.floor(timeInStageMs / (1000 * 60 * 60));

  // 3. Vérification de la Target Date (strictement si la date cible est dépassée par rapport à aujourd'hui)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = targetDate ? new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime() : null;
  const isTargetDateOverdue = targetMidnight !== null && todayMidnight > targetMidnight;

  // 4. Détermination des alertes basées sur le temps RÉELLEMENT passé
  // (Temps passé dans le projet depuis la soumission OU temps passé dans le statut actuel)
  const effectiveHours = Math.max(timeSpentHours, hoursInStage);

  const isRed = isTargetDateOverdue || effectiveHours >= redHours;
  const isYellow = !isRed && effectiveHours >= yellowHours;

  if (isRed) {
    const reason = isTargetDateOverdue
      ? `Red Alert: Target Date exceeded (${targetDisplay})`
      : timeSpentHours >= redHours
      ? `Red Alert: Time spent in project (${timeSpentHours}h / ${timeSpentLabel}) reaches or exceeds critical threshold of ${redHours}h`
      : `Red Alert: In "${normStatus}" for ${hoursInStage}h (Max threshold: ${redHours}h)`;

    return {
      state: "red",
      timeSpentHours,
      timeSpentDays,
      timeSpentLabel,
      plannedDurationHours,
      plannedDurationDays,
      plannedDurationLabel,
      elapsedHours: timeSpentHours,
      elapsedLabel: timeSpentLabel,
      thresholdLabel: `Max ${redHours}h`,
      cellBackground: "#fee2e2",
      borderAccent: "#dc2626",
      badgeBadge: (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 7px",
            borderRadius: "6px",
            background: "#dc2626",
            color: "#ffffff",
            fontSize: "10.5px",
            fontWeight: 800,
            letterSpacing: "0.2px",
            boxShadow: "0 1px 3px rgba(220,38,38,0.35)",
            whiteSpace: "nowrap",
          }}
          title={`${reason} — Time spent: ${timeSpentLabel} (since ${startDisplay}) | Planned duration: ${plannedDurationLabel} (target ${targetDisplay})`}
        >
          🚨 {timeSpentLabel}
        </span>
      ),
    };
  }

  if (isYellow) {
    const reason = timeSpentHours >= yellowHours
      ? `Yellow Warning: Time spent in project (${timeSpentHours}h / ${timeSpentLabel}) reaches or exceeds attention threshold of ${yellowHours}h`
      : `Yellow Warning: In "${normStatus}" for ${hoursInStage}h (Attention threshold: ${yellowHours}h)`;

    return {
      state: "yellow",
      timeSpentHours,
      timeSpentDays,
      timeSpentLabel,
      plannedDurationHours,
      plannedDurationDays,
      plannedDurationLabel,
      elapsedHours: timeSpentHours,
      elapsedLabel: timeSpentLabel,
      thresholdLabel: `Max ${yellowHours}h`,
      cellBackground: "#fef9c3",
      borderAccent: "#d97706",
      badgeBadge: (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 7px",
            borderRadius: "6px",
            background: "#ca8a04",
            color: "#ffffff",
            fontSize: "10.5px",
            fontWeight: 800,
            letterSpacing: "0.2px",
            boxShadow: "0 1px 3px rgba(202,138,4,0.35)",
            whiteSpace: "nowrap",
          }}
          title={`${reason} — Time spent: ${timeSpentLabel} (since ${startDisplay}) | Planned duration: ${plannedDurationLabel} (target ${targetDisplay})`}
        >
          ⚠️ {timeSpentLabel}
        </span>
      ),
    };
  }

  // Normal (dans les délais)
  return {
    state: "normal",
    timeSpentHours,
    timeSpentDays,
    timeSpentLabel,
    plannedDurationHours,
    plannedDurationDays,
    plannedDurationLabel,
    elapsedHours: timeSpentHours,
    elapsedLabel: timeSpentLabel,
    thresholdLabel: `Cible : ${targetDisplay}`,
    cellBackground: "transparent",
    borderAccent: "#0284c7",
    badgeBadge: (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          padding: "2px 7px",
          borderRadius: "6px",
          background: "#e0f2fe",
          color: "#0369a1",
          fontSize: "11px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          border: "1px solid #bae6fd",
        }}
        title={`Temps passé : ${timeSpentLabel} (depuis ${startDisplay}) | Durée prévue : ${plannedDurationLabel} (échéance ${targetDisplay})`}
      >
        ⏱️ {timeSpentLabel}
      </span>
    ),
  };
}

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getFutureDateString = (daysAhead: number = 7): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialFormData = {
  name: "",
  description: "",
  status: "Project initiation & Discovery",
  date: getFutureDateString(7),
  contractor: "",
  priority: "Medium",
  projectType: ["Plan Set"] as string[],
  idReview: "Pending",
  updates: "",
  pmName: "",
  pmEmails: "",
  peerReview: "Not Started",
  drafterName: "",
  drafterEmails: "",
  submittedDate: "",
  rfiStatus: "No RFI",
  pmStatus: "In Review",
  draftingStatus: "Not Started",
  qaAndDeliveryStatus: "Pending QA",
  projectSs: "",
  seTime: "",
  structEngi: "Choose",
  customFields: {} as Record<string, any>,
};

type DashboardProps = {
  user: AuthUser | null;
  onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(user);

  useEffect(() => {
    getMe()
      .then((fresh) => {
        setCurrentUser(fresh);
        localStorage.setItem("adminUser", JSON.stringify(fresh));
      })
      .catch(() => {});
  }, []);

  const effectivePermissions: UserPermissions = useMemo(() => {
    if (currentUser?.role === "admin") {
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
    const p = currentUser?.permissions;
    return {
      canViewProjects: p?.canViewProjects ?? true,
      canViewContractors: p?.canViewContractors ?? true,
      canViewInvoices: p?.canViewInvoices ?? true,
      canViewInterconnection: p?.canViewInterconnection ?? true,
      projectAccess: p?.projectAccess || "all",
      canCreateProjects: p?.canCreateProjects ?? true,
      canEditProjects: p?.canEditProjects ?? true,
      canDeleteProjects: p?.canDeleteProjects ?? false,
      canExportProjects: p?.canExportProjects ?? true,
      canManageContractors: p?.canManageContractors ?? true,
      canEditInvoices: p?.canEditInvoices ?? true,
      canEditInterconnection: p?.canEditInterconnection ?? true,
    };
  }, [currentUser]);

  const [activeView, setActiveView] = useState<"projects" | "contractors" | "subadmins" | "invoices" | "interconnection">("projects");

  useEffect(() => {
    if (activeView === "projects" && !effectivePermissions.canViewProjects) {
      if (effectivePermissions.canViewInterconnection) setActiveView("interconnection");
      else if (effectivePermissions.canViewInvoices) setActiveView("invoices");
      else if (effectivePermissions.canViewContractors) setActiveView("contractors");
    } else if (activeView === "contractors" && !effectivePermissions.canViewContractors) {
      if (effectivePermissions.canViewProjects) setActiveView("projects");
      else if (effectivePermissions.canViewInterconnection) setActiveView("interconnection");
      else if (effectivePermissions.canViewInvoices) setActiveView("invoices");
    } else if (activeView === "invoices" && !effectivePermissions.canViewInvoices) {
      if (effectivePermissions.canViewProjects) setActiveView("projects");
      else if (effectivePermissions.canViewInterconnection) setActiveView("interconnection");
      else if (effectivePermissions.canViewContractors) setActiveView("contractors");
    } else if (activeView === "interconnection" && !effectivePermissions.canViewInterconnection) {
      if (effectivePermissions.canViewProjects) setActiveView("projects");
      else if (effectivePermissions.canViewInvoices) setActiveView("invoices");
      else if (effectivePermissions.canViewContractors) setActiveView("contractors");
    }
  }, [effectivePermissions, activeView]);
  const [projects, setProjects] = useState<ProjectDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contractorsList, setContractorsList] = useState<Contractor[]>([]);
  const [customVariables, setCustomVariables] = useState<CustomVariable[]>([]);
  const [showVariablesModal, setShowVariablesModal] = useState<boolean>(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("advanced_hidden_columns");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showManageColumnsModal, setShowManageColumnsModal] = useState<boolean>(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<string | number | null>(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [mentionableUsers, setMentionableUsers] = useState<SubadminUser[]>([]);

  useEffect(() => {
    getMentionableUsers()
      .then((users) => {
        if (Array.isArray(users)) {
          setMentionableUsers(users);
        }
      })
      .catch((err) => {
        console.error("Failed to load mentionable users:", err);
      });
  }, []);

  const renderCommentTextWithMentions = (text: string) => {
    if (!text) return null;
    const mentionRegex = /(@[a-zA-Z0-9_]+(?:\s+[a-zA-Z0-9_]+)?)/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const cleanName = part.slice(1).trim().toLowerCase();
        const matched = mentionableUsers.find(
          (u) =>
            u.name.toLowerCase() === cleanName ||
            u.name.toLowerCase().startsWith(cleanName) ||
            cleanName.startsWith(u.name.toLowerCase())
        );
        return (
          <span
            key={index}
            className="mention-tag"
            title={matched ? `${matched.name} (${matched.email} - ${matched.role})` : part}
          >
            {part}
          </span>
        );
      }
      return <Fragment key={index}>{part}</Fragment>;
    });
  };
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [newFile, setNewFile] = useState({ name: "", url: "" });
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newImage, setNewImage] = useState({ url: "", title: "" });
  const [selectedImageObj, setSelectedImageObj] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "links" | "files" | "images">("comments");

  const [formData, setFormData] = useState(initialFormData);
  const [modalTab, setModalTab] = useState<"general" | "team" | "workflow" | "engineering">("general");

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [groupPages, setGroupPages] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortProjectType, setSortProjectType] = useState<string>("all");
  const [sortBoardStatus, setSortBoardStatus] = useState<string>("all");
  const [viewLayout, setViewLayout] = useState<"grouped" | "flat">("grouped");
  const [flatPage, setFlatPage] = useState<number>(1);
  const FLAT_PAGE_SIZE = 15;
  const ITEMS_PER_PAGE = 5;

  const availableProjectTypes = useMemo(() => {
    const list = [...PROJECT_TYPES];
    projects.forEach((p) => {
      normalizeProjectTypes(p.projectType).forEach((pt) => {
        if (!list.some((item) => item.toLowerCase() === pt.toLowerCase())) {
          list.push(pt as any);
        }
      });
    });
    return list;
  }, [projects]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getGroupPage = (key: string) => groupPages[key] || 1;
  const setGroupPage = (key: string, page: number) => {
    setGroupPages((prev) => ({ ...prev, [key]: page }));
  };

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [activeService, setActiveService] = useState<string>("Plan Set Design");
  const [showStatusSettingsModal, setShowStatusSettingsModal] = useState(false);
  const [newStatusForm, setNewStatusForm] = useState({
    name: "",
    color: "#3b82f6",
    icon: "📌",
    yellowHours: 24,
    redHours: 48,
  });
  const [editingThresholds, setEditingThresholds] = useState<Record<string, { yellow: number; red: number }>>({});
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    getFieldLabels()
      .then((res) => {
        if (res && res.dictionary) {
          setFieldLabels(res.dictionary);
        }
      })
      .catch((err) => console.error("Error loading field labels:", err));
  }, []);

  const getLabel = (key: string, fallback: string) => fieldLabels[key] || fallback;

  useEffect(() => {
    getWorkflowStatuses(activeService)
      .then((data) => {
        if (data && data.length > 0) {
          setWorkflowStatuses(data);
          const initialMap: Record<string, { yellow: number; red: number }> = {};
          data.forEach((s) => {
            initialMap[s._id] = {
              yellow: s.yellowThresholdHours ?? 24,
              red: s.redThresholdHours ?? 48,
            };
          });
          setEditingThresholds(initialMap);
        }
      })
      .catch((err) => console.error("Error loading workflow statuses:", err));
  }, [activeService]);

  const GROUPS = workflowStatuses.length > 0
    ? workflowStatuses.map((s) => ({
        key: s.key,
        title: s.name,
        color: s.color,
        badgeColor: s.badgeColor || s.color,
        lightBg: s.lightBg,
        borderColor: s.borderColor,
        headerBg: s.headerBg || "#f8fafc",
        icon: s.icon,
        emptyText: s.emptyText,
        yellowThresholdHours: s.yellowThresholdHours,
        redThresholdHours: s.redThresholdHours,
      }))
    : PROJECT_GROUPS;

  const getStatusLabel = (status: string) => {
    const norm = normalizeStatus(status);
    const grp = GROUPS.find((g) => g.key === norm);
    return grp ? grp.title : norm;
  };

  const availableBoardStatuses = useMemo(() => {
    return GROUPS.map((g) => ({ key: g.key, title: g.title }));
  }, [GROUPS]);

  const mapProjectComments = (p: any): Comment[] => {
    return (p.comments || []).map((c: any) => ({
      id: c._id || c.id || Date.now(),
      text: c.text,
      author: c.author || "Admin",
      date: c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
      isEdited: Boolean(c.isEdited),
      replies: (c.replies || []).map((r: any) => ({
        id: r._id || r.id || Date.now(),
        text: r.text,
        author: r.author || "Admin",
        date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
        isEdited: Boolean(r.isEdited),
      })),
    }));
  };

  const mapProjectLinks = (p: any): Link[] => {
    return (p.links || []).map((l: any) => ({
      id: l._id || l.id || Date.now(),
      title: l.title,
      url: l.url,
    }));
  };

  const mapProjectToFileItems = (p: any): FileItem[] => {
    return (p.files || []).map((f: any) => ({
      id: f._id || f.id || Date.now(),
      name: f.name || f.originalName || "File",
      url: typeof f.url === "string" && f.url.startsWith("http") ? f.url : `http://localhost:5000${f.url || ""}`,
      size: f.size,
    }));
  };

  const mapProjectToImageItems = (p: any): ImageItem[] => {
    return (p.images || []).map((img: any) => ({
      id: img._id || img.id || Date.now(),
      title: img.title || img.originalName || "Image",
      url: typeof img.url === "string" && img.url.startsWith("http") ? img.url : `http://localhost:5000${img.url || ""}`,
      size: img.size,
    }));
  };

  const fetchProjectsList = () => {
    getProjects()
      .then((data) =>
        setProjects(
          data.map((p) => ({
            ...p,
            id: p._id,
            customFields: p.customFields || {},
            comments: mapProjectComments(p),
            links: mapProjectLinks(p),
            files: mapProjectToFileItems(p),
            images: mapProjectToImageItems(p),
          }))
        )
      )
      .catch((err) => console.error("Failed to load projects:", err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProjectsList();

    getContractors()
      .then(setContractorsList)
      .catch((err) => alert(err.message));

    getCustomVariables()
      .then(setCustomVariables)
      .catch((err) => console.error("Failed to load custom variables:", err));
  }, []);

  const isDuplicateProjectName = Boolean(
    formData.name.trim() &&
    projects.some(
      (p) =>
        p.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        (!editingId || p.id !== editingId)
    )
  );

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.date) {
      alert("Please fill in project name and date!");
      return;
    }

    const today = getTodayDateString();
    if (formData.submittedDate && formData.submittedDate > today) {
      alert("La date de soumission (Submitted Date) ne peut pas être dans le futur. Elle doit être aujourd'hui ou dans le passé.");
      return;
    }

    if (formData.date && formData.date < today) {
      alert("La date cible (Target Date) ne peut pas être dans le passé. Elle doit être aujourd'hui ou dans le futur.");
      return;
    }

    if (isDuplicateProjectName) {
      alert(`A project named "${formData.name.trim()}" already exists in the table. Please choose a unique project name.`);
      return;
    }

    if (editingId) {
      if (!effectivePermissions.canEditProjects) {
        alert("You do not have permission to edit projects.");
        return;
      }
    } else {
      if (!effectivePermissions.canCreateProjects) {
        alert("You do not have permission to create projects.");
        return;
      }
    }

    try {
      if (editingId) {
        const updated = await updateProject(editingId, {
          ...formData,
          name: formData.name.trim(),
        });
        setProjects(
          projects.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  ...formData,
                  ...updated,
                  name: updated.name,
                  id: updated._id,
                  contractor: updated.contractor,
                  comments: mapProjectComments(updated),
                  links: mapProjectLinks(updated),
                  files: mapProjectToFileItems(updated),
                  images: mapProjectToImageItems(updated),
                }
              : p
          )
        );
      } else {
        const created = await createProject({
          ...formData,
          name: formData.name.trim(),
          serviceType: activeService,
        });
        setProjects([
          {
            ...formData,
            ...created,
            name: created.name,
            id: created._id,
            contractor: created.contractor,
            comments: mapProjectComments(created),
            links: mapProjectLinks(created),
            files: mapProjectToFileItems(created),
            images: mapProjectToImageItems(created),
          },
          ...projects,
        ]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "An error occurred while saving the project.");
    }
  };

  const handleEdit = (project: ProjectDetail) => {
    setFormData({
      name: project.name || "",
      description: project.description || "",
      status: normalizeStatus(project.status),
      date: project.date || "",
      contractor: project.contractor?._id || "",
      priority: project.priority || "Medium",
      projectType: normalizeProjectTypes(project.projectType),
      idReview: project.idReview || "",
      updates: project.updates || "",
      pmName: project.pmName || "",
      pmEmails: project.pmEmails || "",
      peerReview: project.peerReview || "",
      drafterName: project.drafterName || "",
      drafterEmails: project.drafterEmails || "",
      submittedDate: project.submittedDate || "",
      rfiStatus: project.rfiStatus || "",
      pmStatus: project.pmStatus || "",
      draftingStatus: project.draftingStatus || "",
      qaAndDeliveryStatus: project.qaAndDeliveryStatus || "",
      projectSs: project.projectSs || "",
      seTime: project.seTime || "",
      structEngi: project.structEngi || "Choose",
      customFields: project.customFields || {},
    });
    setEditingId(project.id);
    setModalTab("general");
    setShowForm(true);
  };

  const handleDelete = (id: string, projectName?: string) => {
    const target = projects.find((p) => p.id === id);
    const displayName = projectName || target?.name || "this project";
    setProjectToDelete({ id, name: displayName });
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeletingProject(true);
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      if (selectedProjectId === projectToDelete.id) {
        setSelectedProjectId(null);
      }
      setProjectToDelete(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleUpdateField = async (project: ProjectDetail, fieldName: string, value: any): Promise<boolean> => {
    if (!effectivePermissions.canEditProjects) {
      alert("You do not have permission to edit this project.");
      return false;
    }
    try {
      const updated = await updateProject(project.id, { [fieldName]: value } as any);
      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                [fieldName]: value,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
      return true;
    } catch (err: any) {
      alert(err.message || "Error updating field");
      return false;
    }
  };

  const handleUpdateName = async (project: ProjectDetail, newName: string): Promise<boolean> => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Project title cannot be empty.");
      return false;
    }
    if (projects.some((p) => p.id !== project.id && p.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      alert(`A project named "${trimmed}" already exists. Please choose a unique project name.`);
      return false;
    }
    if (trimmed !== project.name) {
      return await handleUpdateField(project, "name", trimmed);
    }
    return true;
  };

  const handleUpdateDescription = async (project: ProjectDetail, newDesc: string): Promise<boolean> => {
    const trimmed = newDesc.trim();
    if (trimmed !== (project.description || "").trim()) {
      return await handleUpdateField(project, "description", trimmed);
    }
    return true;
  };

  const handleUpdatePM = async (project: ProjectDetail, userEmailOrId: string) => {
    if (!effectivePermissions.canEditProjects) {
      alert("You do not have permission to edit this project.");
      return;
    }
    if (!userEmailOrId) {
      try {
        const updated = await updateProject(project.id, { pmName: "", pmEmails: "" } as any);
        setProjects(
          projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  ...updated,
                  id: updated._id,
                  pmName: "",
                  pmEmails: "",
                  comments: mapProjectComments(updated),
                  links: mapProjectLinks(updated),
                  files: mapProjectToFileItems(updated),
                  images: mapProjectToImageItems(updated),
                }
              : p
          )
        );
      } catch (err: any) {
        alert(err.message || "Error updating PM");
      }
      return;
    }

    const matchedUser = mentionableUsers.find(
      (u) =>
        u.email.toLowerCase() === userEmailOrId.toLowerCase() ||
        u.name.toLowerCase() === userEmailOrId.toLowerCase() ||
        u._id === userEmailOrId
    );

    const newPmName = matchedUser ? matchedUser.name : userEmailOrId;
    const newPmEmails = matchedUser ? matchedUser.email : "";

    try {
      const updated = await updateProject(project.id, {
        pmName: newPmName,
        pmEmails: newPmEmails,
      } as any);

      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                pmName: newPmName,
                pmEmails: newPmEmails,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error updating PM");
    }
  };

  const handleUpdateDrafter = async (project: ProjectDetail, userEmailOrId: string) => {
    if (!effectivePermissions.canEditProjects) {
      alert("You do not have permission to edit this project.");
      return;
    }
    if (!userEmailOrId) {
      try {
        const updated = await updateProject(project.id, { drafterName: "", drafterEmails: "" } as any);
        setProjects(
          projects.map((p) =>
            p.id === project.id
              ? {
                  ...p,
                  ...updated,
                  id: updated._id,
                  drafterName: "",
                  drafterEmails: "",
                  comments: mapProjectComments(updated),
                  links: mapProjectLinks(updated),
                  files: mapProjectToFileItems(updated),
                  images: mapProjectToImageItems(updated),
                }
              : p
          )
        );
      } catch (err: any) {
        alert(err.message || "Error updating Drafter");
      }
      return;
    }

    const matchedUser = mentionableUsers.find(
      (u) =>
        u.email.toLowerCase() === userEmailOrId.toLowerCase() ||
        u.name.toLowerCase() === userEmailOrId.toLowerCase() ||
        u._id === userEmailOrId
    );

    const newDrafterName = matchedUser ? matchedUser.name : userEmailOrId;
    const newDrafterEmails = matchedUser ? matchedUser.email : "";

    try {
      const updated = await updateProject(project.id, {
        drafterName: newDrafterName,
        drafterEmails: newDrafterEmails,
      } as any);

      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                drafterName: newDrafterName,
                drafterEmails: newDrafterEmails,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error updating Drafter");
    }
  };

  const handleUpdateCustomField = async (project: ProjectDetail, fieldKey: string, value: any): Promise<boolean> => {
    try {
      const newCustomFields = {
        ...(project.customFields || {}),
        [fieldKey]: value,
      };
      return await handleUpdateField(project, "customFields", newCustomFields);
    } catch (err: any) {
      alert(err.message || "Error updating custom field");
      return false;
    }
  };

  const handleUpdateFieldLabel = async (key: string, newLabel: string): Promise<boolean> => {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      alert("Column label cannot be empty.");
      return false;
    }
    try {
      const res = await updateFieldLabels({ [key]: trimmed });
      setFieldLabels(res.dictionary);
      return true;
    } catch (err: any) {
      alert(err.message || "Failed to update column label");
      return false;
    }
  };

  const handleUpdateCustomVariableName = async (variable: CustomVariable, newName: string): Promise<boolean> => {
    const trimmed = newName.trim();
    if (!trimmed) {
      alert("Variable name cannot be empty.");
      return false;
    }
    if (
      customVariables.some(
        (v) => v._id !== variable._id && v.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      alert(`A variable named "${trimmed}" already exists.`);
      return false;
    }
    try {
      const updated = await updateCustomVariable(variable._id, { name: trimmed });
      setCustomVariables((prev) =>
        prev.map((v) => (v._id === variable._id ? updated : v))
      );
      return true;
    } catch (err: any) {
      alert(err.message || "Failed to update custom variable");
      return false;
    }
  };

  const handleDeleteCustomVariableFromHeader = async (variable: CustomVariable) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the column "${variable.name}"? This column will be removed from the table and all projects.`
      )
    ) {
      return;
    }
    try {
      await deleteCustomVariable(variable._id);
      setCustomVariables((prev) => prev.filter((v) => v._id !== variable._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete custom variable");
    }
  };

  const handleHideColumn = (fieldKey: string, label: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove the column "${label}" from the table? You can restore it anytime from the Columns menu.`
      )
    ) {
      return;
    }
    const next = [...hiddenColumns, fieldKey];
    setHiddenColumns(next);
    try {
      localStorage.setItem("advanced_hidden_columns", JSON.stringify(next));
    } catch {}
  };

  const handleToggleColumnVisibility = (fieldKey: string) => {
    let next: string[];
    if (hiddenColumns.includes(fieldKey)) {
      next = hiddenColumns.filter((k) => k !== fieldKey);
    } else {
      next = [...hiddenColumns, fieldKey];
    }
    setHiddenColumns(next);
    try {
      localStorage.setItem("advanced_hidden_columns", JSON.stringify(next));
    } catch {}
  };

  const handleResetAllColumns = () => {
    setHiddenColumns([]);
    try {
      localStorage.removeItem("advanced_hidden_columns");
    } catch {}
  };

  const handleUpdateContractor = async (project: ProjectDetail, contractorId: string) => {
    try {
      const updated = await updateProject(project.id, {
        contractor: contractorId,
      });
      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                contractor: updated.contractor,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStatus = async (project: ProjectDetail, newStatus: string) => {
    try {
      const now = new Date().toISOString();
      const updated = await updateProject(project.id, {
        status: newStatus,
      });
      setProjects(
        projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                ...updated,
                id: updated._id,
                status: newStatus,
                statusUpdatedAt: updated.statusUpdatedAt || now,
                comments: mapProjectComments(updated),
                links: mapProjectLinks(updated),
                files: mapProjectToFileItems(updated),
                images: mapProjectToImageItems(updated),
              }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error updating status");
    }
  };

  const handleSaveThreshold = async (statusId: string) => {
    const values = editingThresholds[statusId];
    if (!values) return;
    try {
      setIsSavingStatus(true);
      const updated = await updateWorkflowStatus(statusId, {
        yellowThresholdHours: Number(values.yellow) || 24,
        redThresholdHours: Number(values.red) || 48,
      });
      setWorkflowStatuses((prev) =>
        prev.map((s) => (s._id === statusId ? { ...s, ...updated } : s))
      );
      alert(`Thresholds updated for "${updated.name}"!`);
    } catch (err: any) {
      alert(err.message || "Error saving thresholds");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleCreateNewStatus = async () => {
    if (!newStatusForm.name.trim()) {
      alert("Please enter a status name");
      return;
    }
    try {
      setIsSavingStatus(true);
      const created = await createWorkflowStatus({
        name: newStatusForm.name.trim(),
        key: newStatusForm.name.trim(),
        serviceType: activeService,
        color: newStatusForm.color,
        icon: newStatusForm.icon || "📌",
        yellowThresholdHours: Number(newStatusForm.yellowHours) || 24,
        redThresholdHours: Number(newStatusForm.redHours) || 48,
      });
      setWorkflowStatuses((prev) => [...prev, created]);
      setEditingThresholds((prev) => ({
        ...prev,
        [created._id]: {
          yellow: created.yellowThresholdHours,
          red: created.redThresholdHours,
        },
      }));
      setNewStatusForm({
        name: "",
        color: "#3b82f6",
        icon: "📌",
        yellowHours: 24,
        redHours: 48,
      });
      alert(`Status "${created.name}" created successfully!`);
    } catch (err: any) {
      alert(err.message || "Error creating status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleDeleteWorkflowStatus = async (statusId: string, statusName: string) => {
    if (!window.confirm(`Are you sure you want to delete status "${statusName}"?`)) return;
    try {
      setIsSavingStatus(true);
      await deleteWorkflowStatus(statusId);
      setWorkflowStatuses((prev) => prev.filter((s) => s._id !== statusId));
    } catch (err: any) {
      alert(err.message || "Error deleting status");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      date: getFutureDateString(7),
      submittedDate: "",
    });
    setShowForm(false);
    setEditingId(null);
    setModalTab("general");
  };

  const handleAddComment = async (projectId: string) => {
    if (!newComment.trim()) return;
    try {
      const author = user?.name || "Admin";
      const res = await addProjectComment(projectId, { text: newComment.trim(), author });
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                comments: mapProjectComments(res.project),
              }
            : p
        )
      );
      setNewComment("");
    } catch (err: any) {
      alert(err.message || "Error adding comment");
    }
  };

  const handleDeleteComment = async (projectId: string, commentId: string | number) => {
    try {
      if (typeof commentId === "string" && commentId.length === 24) {
        const res = await deleteProjectComment(projectId, commentId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting comment");
    }
  };

  const handleAddReply = async (projectId: string, commentId: string | number) => {
    if (!replyText.trim()) return;
    try {
      const author = user?.name || "Admin";
      if (typeof commentId === "string" && commentId.length === 24) {
        const res = await addCommentReply(projectId, commentId, { text: replyText.trim(), author });
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          replies: [
                            ...c.replies,
                            {
                              id: Date.now(),
                              text: replyText.trim(),
                              author,
                              date: new Date().toLocaleDateString(),
                            },
                          ],
                        }
                      : c
                  ),
                }
              : p
          )
        );
      }
      setReplyText("");
      setReplyingToCommentId(null);
    } catch (err: any) {
      alert(err.message || "Error adding reply");
    }
  };

  const handleDeleteReply = async (projectId: string, commentId: string | number, replyId: string | number) => {
    try {
      if (typeof commentId === "string" && typeof replyId === "string" && commentId.length === 24 && replyId.length === 24) {
        const res = await deleteCommentReply(projectId, commentId, replyId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
                      : c
                  ),
                }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting reply");
    }
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
    setReplyingToCommentId(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveComment = async (projectId: string, commentId: string | number) => {
    if (!editingCommentText.trim()) return;
    try {
      if (typeof commentId === "string" && commentId.length === 24) {
        const res = await updateProjectComment(projectId, commentId, { text: editingCommentText.trim() });
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? { ...c, text: editingCommentText.trim(), isEdited: true }
                      : c
                  ),
                }
              : p
          )
        );
      }
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (err: any) {
      alert(err.message || "Error updating comment");
    }
  };

  const handleStartEditReply = (reply: CommentReply) => {
    setEditingReplyId(reply.id);
    setEditingReplyText(reply.text);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyText("");
  };

  const handleSaveReply = async (projectId: string, commentId: string | number, replyId: string | number) => {
    if (!editingReplyText.trim()) return;
    try {
      if (
        typeof commentId === "string" &&
        typeof replyId === "string" &&
        commentId.length === 24 &&
        replyId.length === 24
      ) {
        const res = await updateCommentReply(projectId, commentId, replyId, { text: editingReplyText.trim() });
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, comments: mapProjectComments(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  comments: p.comments.map((c) =>
                    c.id === commentId
                      ? {
                          ...c,
                          replies: c.replies.map((r) =>
                            r.id === replyId
                              ? { ...r, text: editingReplyText.trim(), isEdited: true }
                              : r
                          ),
                        }
                      : c
                  ),
                }
              : p
          )
        );
      }
      setEditingReplyId(null);
      setEditingReplyText("");
    } catch (err: any) {
      alert(err.message || "Error updating reply");
    }
  };

  const handleAddLink = async (projectId: string) => {
    if (!newLink.title || !newLink.url) return;
    try {
      const res = await addProjectLink(projectId, { title: newLink.title, url: newLink.url });
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, links: mapProjectLinks(res.project) }
            : p
        )
      );
      setNewLink({ title: "", url: "" });
    } catch (err: any) {
      alert(err.message || "Error adding link");
    }
  };

  const handleDeleteLink = async (projectId: string, linkId: string | number) => {
    try {
      if (typeof linkId === "string" && linkId.length === 24) {
        const res = await deleteProjectLink(projectId, linkId);
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, links: mapProjectLinks(res.project) }
              : p
          )
        );
      } else {
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, links: p.links.filter((l) => l.id !== linkId) }
              : p
          )
        );
      }
    } catch (err: any) {
      alert(err.message || "Error deleting link");
    }
  };

  const handleAddFile = async (projectId: string) => {
    if (selectedFileObj) {
      setIsUploading(true);
      try {
        const res = await uploadProjectFile(
          projectId,
          selectedFileObj,
          newFile.name.trim() || undefined
        );
        const uploadedFileItem: FileItem = {
          id: res.file._id,
          name: res.file.name || res.file.originalName,
          url: res.file.url.startsWith("http")
            ? res.file.url
            : `http://localhost:5000${res.file.url}`,
          size: res.file.size,
        };
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, files: [...p.files, uploadedFileItem] }
              : p
          )
        );
        setSelectedFileObj(null);
        setNewFile({ name: "", url: "" });
      } catch (err: any) {
        alert(err.message || "Error uploading file");
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!newFile.name || !newFile.url) {
      alert("Please select a file to upload or enter a URL.");
      return;
    }
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              files: [
                ...p.files,
                { id: Date.now(), name: newFile.name, url: newFile.url },
              ],
            }
          : p
      )
    );
    setNewFile({ name: "", url: "" });
  };

  const handleAddImage = async (projectId: string) => {
    if (selectedImageObj) {
      setIsUploadingImage(true);
      try {
        const res = await uploadProjectImage(
          projectId,
          selectedImageObj,
          newImage.title.trim() || undefined
        );
        const uploadedImageItem: ImageItem = {
          id: res.image._id,
          title: res.image.title || res.image.originalName,
          url: res.image.url.startsWith("http")
            ? res.image.url
            : `http://localhost:5000${res.image.url}`,
          size: res.image.size,
        };
        setProjects(
          projects.map((p) =>
            p.id === projectId
              ? { ...p, images: [...p.images, uploadedImageItem] }
              : p
          )
        );
        setSelectedImageObj(null);
        setNewImage({ url: "", title: "" });
      } catch (err: any) {
        alert(err.message || "Error uploading image");
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    if (!newImage.url) {
      alert("Please select an image to upload or enter a URL.");
      return;
    }
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              images: [
                ...p.images,
                { id: Date.now(), url: newImage.url, title: newImage.title },
              ],
            }
          : p
      )
    );
    setNewImage({ url: "", title: "" });
  };

  const handleDeleteFile = async (projectId: string, fileId: string | number) => {
    try {
      if (typeof fileId === "string" && fileId.length === 24) {
        await deleteProjectFile(projectId, fileId);
      }
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, files: p.files.filter((f) => f.id !== fileId) }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error deleting file");
    }
  };

  const handleDeleteImage = async (projectId: string, imageId: string | number) => {
    try {
      if (typeof imageId === "string") {
        await deleteProjectImage(projectId, imageId);
      }
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, images: p.images.filter((i) => i.id !== imageId) }
            : p
        )
      );
    } catch (err: any) {
      alert(err.message || "Error deleting image");
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportProjectsCSV();
    } catch (err: any) {
      alert(err.message || "Error exporting CSV");
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportProjectsPDF();
    } catch (err: any) {
      alert(err.message || "Error exporting PDF");
    }
  };

  const handleExportAllUploadedFilesZip = async () => {
    try {
      await exportAllUploadedFilesZip();
    } catch (err: any) {
      alert(err.message || "Error exporting ZIP");
    }
  };

  const handleExportProjectFilesZip = async (projectId: string, projectName: string) => {
    try {
      await exportProjectFilesZip(projectId, projectName);
    } catch (err: any) {
      alert(err.message || "Error exporting project ZIP");
    }
  };

  const handleDownloadFile = async (projectId: string, fileId: string | number, fileName: string) => {
    try {
      if (typeof fileId === "string" && fileId.length === 24) {
        await downloadProjectFile(projectId, fileId, fileName);
      } else {
        const file = selectedProject?.files.find((f) => f.id === fileId);
        if (file?.url) {
          const res = await fetch(file.url);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err: any) {
      alert(err.message || "Error downloading file");
    }
  };

  const handleDownloadImage = async (projectId: string, imageId: string | number, imageName: string) => {
    try {
      if (typeof imageId === "string" && imageId.length === 24) {
        await downloadProjectImage(projectId, imageId, imageName);
      } else {
        const img = selectedProject?.images.find((i) => i.id === imageId);
        if (img?.url) {
          const res = await fetch(img.url);
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = imageName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (err: any) {
      alert(err.message || "Error downloading image");
    }
  };

  const filteredProjects = projects.filter((p) => {
    const projectService = p.serviceType || "Plan Set Design";
    if (projectService !== activeService) return false;

    // Permissions: restricted to assigned projects if projectAccess is "assigned"
    if (effectivePermissions.projectAccess === "assigned" && currentUser?.role !== "admin") {
      const uEmail = (currentUser?.email || "").toLowerCase();
      const uName = (currentUser?.name || "").toLowerCase();
      const isAssigned =
        (p.pmEmails || "").toLowerCase().includes(uEmail) ||
        (p.pmName || "").toLowerCase().includes(uName) ||
        (p.drafterEmails || "").toLowerCase().includes(uEmail) ||
        (p.drafterName || "").toLowerCase().includes(uName);
      if (!isAssigned) return false;
    }

    if (!searchTerm.trim()) return true;
    const query = searchTerm.toLowerCase().trim();
    const nameMatch = (p.name || "").toLowerCase().includes(query);
    const descMatch = (p.description || "").toLowerCase().includes(query);
    const contractorMatch = (p.contractor?.nom || "").toLowerCase().includes(query);
    const dateMatch = (p.date || "").toLowerCase().includes(query);
    const statusMatch = (p.status || "").toLowerCase().includes(query);
    const pmMatch = (p.pmName || "").toLowerCase().includes(query);
    const drafterMatch = (p.drafterName || "").toLowerCase().includes(query);
    const typeMatch = normalizeProjectTypes(p.projectType).some((t) => t.toLowerCase().includes(query));
    const priorityMatch = (p.priority || "").toLowerCase().includes(query);
    const rfiMatch = (p.rfiStatus || "").toLowerCase().includes(query);
    const structMatch = (p.structEngi || "").toLowerCase().includes(query);
    const filesMatch = (p.files || []).some((f) => (f.name || "").toLowerCase().includes(query));
    return nameMatch || descMatch || contractorMatch || dateMatch || statusMatch || pmMatch || drafterMatch || typeMatch || priorityMatch || rfiMatch || structMatch || filesMatch;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let comp = 0;
    if (sortField === "name") {
      comp = (a.name || "").localeCompare(b.name || "");
    } else if (sortField === "priority") {
      const pA = PRIORITY_ORDER[a.priority?.toLowerCase() || "medium"] || 2;
      const pB = PRIORITY_ORDER[b.priority?.toLowerCase() || "medium"] || 2;
      comp = pA - pB;
    } else if (sortField === "projectType") {
      if (sortProjectType && sortProjectType !== "all") {
        const target = sortProjectType.toLowerCase();
        const hasA = normalizeProjectTypes(a.projectType).some((t) => t.toLowerCase() === target);
        const hasB = normalizeProjectTypes(b.projectType).some((t) => t.toLowerCase() === target);
        if (hasA !== hasB) {
          comp = hasA ? -1 : 1;
        } else {
          comp = (a.name || "").localeCompare(b.name || "");
        }
      } else {
        comp = normalizeProjectTypes(a.projectType).join(", ").localeCompare(normalizeProjectTypes(b.projectType).join(", "));
      }
    } else if (sortField === "contractor") {
      const nomA = a.contractor?.nom || "";
      const nomB = b.contractor?.nom || "";
      comp = nomA.localeCompare(nomB);
    } else if (sortField === "status") {
      if (sortBoardStatus && sortBoardStatus !== "all") {
        const target = sortBoardStatus.toLowerCase();
        const normA = normalizeStatus(a.status).toLowerCase();
        const normB = normalizeStatus(b.status).toLowerCase();
        const isMatchA = normA === target || (a.status || "").toLowerCase() === target;
        const isMatchB = normB === target || (b.status || "").toLowerCase() === target;
        if (isMatchA !== isMatchB) {
          comp = isMatchA ? -1 : 1;
        } else {
          comp = (a.name || "").localeCompare(b.name || "");
        }
      } else {
        comp = (a.status || "").localeCompare(b.status || "");
      }
    } else if (sortField === "submittedDate") {
      comp = (a.submittedDate || "").localeCompare(b.submittedDate || "");
    } else if (sortField === "date") {
      comp = (a.date || "").localeCompare(b.date || "");
    } else if (sortField === "timeSpent") {
      const timeA = getProjectTimelineHighlight(a, workflowStatuses).timeSpentHours;
      const timeB = getProjectTimelineHighlight(b, workflowStatuses).timeSpentHours;
      comp = timeA - timeB;
    } else if (sortField === "targetDuration") {
      const durA = getProjectTimelineHighlight(a, workflowStatuses).plannedDurationHours;
      const durB = getProjectTimelineHighlight(b, workflowStatuses).plannedDurationHours;
      comp = durA - durB;
    } else if (sortField === "pmName") {
      comp = (a.pmName || "").localeCompare(b.pmName || "");
    } else if (sortField === "pmEmails") {
      comp = (a.pmEmails || "").localeCompare(b.pmEmails || "");
    } else if (sortField === "drafterName") {
      comp = (a.drafterName || "").localeCompare(b.drafterName || "");
    } else if (sortField === "drafterEmails") {
      comp = (a.drafterEmails || "").localeCompare(b.drafterEmails || "");
    } else if (sortField === "structEngi") {
      comp = (a.structEngi || "").localeCompare(b.structEngi || "");
    } else if (sortField === "seTime") {
      comp = (a.seTime || "").localeCompare(b.seTime || "");
    } else if (sortField === "pmStatus") {
      comp = (a.pmStatus || "").localeCompare(b.pmStatus || "");
    } else if (sortField === "draftingStatus") {
      comp = (a.draftingStatus || "").localeCompare(b.draftingStatus || "");
    } else if (sortField === "qaAndDeliveryStatus") {
      comp = (a.qaAndDeliveryStatus || "").localeCompare(b.qaAndDeliveryStatus || "");
    } else if (sortField === "idReview") {
      comp = (a.idReview || "").localeCompare(b.idReview || "");
    } else if (sortField === "peerReview") {
      comp = (a.peerReview || "").localeCompare(b.peerReview || "");
    } else if (sortField === "rfiStatus") {
      comp = (a.rfiStatus || "").localeCompare(b.rfiStatus || "");
    } else if (sortField === "projectSs") {
      comp = (a.projectSs || "").localeCompare(b.projectSs || "");
    } else if (sortField === "updates") {
      comp = (a.updates || "").localeCompare(b.updates || "");
    } else if (sortField === "files") {
      comp = ((a.files?.length || 0) + (a.images?.length || 0)) - ((b.files?.length || 0) + (b.images?.length || 0));
    } else if (sortField === "comments") {
      comp = (a.comments?.length || 0) - (b.comments?.length || 0);
    } else if (sortField.startsWith("custom_")) {
      const customKey = sortField.replace("custom_", "");
      const customVar = customVariables.find((v) => v.key === customKey);
      const valA = a.customFields?.[customKey];
      const valB = b.customFields?.[customKey];
      if (customVar?.type === "number") {
        comp = (Number(valA) || 0) - (Number(valB) || 0);
      } else {
        comp = String(valA || "").localeCompare(String(valB || ""));
      }
    }
    return sortOrder === "asc" ? comp : -comp;
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalProjects = projects.length;
  const processingCount = projects.filter((p) => normalizeStatus(p.status) === "Project Processing").length;
  const awaitingCount = projects.filter((p) => ["Awaiting Client Response", "on Hold/Stuck"].includes(normalizeStatus(p.status))).length;
  const completedCount = projects.filter((p) => normalizeStatus(p.status) === "Completed").length;

  const handleStatCardClick = (target: "all" | "processing" | "awaiting" | "completed") => {
    let targetKey = "";
    let targetElementId = "";

    if (target === "all") {
      setFilterGroup("all");
      targetElementId = "tables-section";
    } else if (target === "processing") {
      targetKey = "Project Processing";
      targetElementId = "group-table-Project-Processing";
      setFilterGroup((prev) => (prev === targetKey ? "all" : targetKey));
      setCollapsedGroups((prev) => ({ ...prev, [targetKey]: false }));
    } else if (target === "awaiting") {
      targetKey = "awaiting_on_hold";
      targetElementId = "group-table-Awaiting-Client-Response";
      setFilterGroup((prev) => (prev === targetKey ? "all" : targetKey));
      setCollapsedGroups((prev) => ({
        ...prev,
        "Awaiting Client Response": false,
        "on Hold/Stuck": false,
      }));
    } else if (target === "completed") {
      targetKey = "Completed";
      targetElementId = "group-table-Completed";
      setFilterGroup((prev) => (prev === targetKey ? "all" : targetKey));
      setCollapsedGroups((prev) => ({ ...prev, [targetKey]: false }));
    }

    setTimeout(() => {
      const el =
        document.getElementById(targetElementId) ||
        document.getElementById("tables-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("table-focus-pulse");
        setTimeout(() => el.classList.remove("table-focus-pulse"), 1800);
      }
    }, 80);
  };

  const displayedFlatProjects = filterGroup === "all"
    ? sortedProjects
    : filterGroup === "awaiting_on_hold"
    ? sortedProjects.filter((p) => ["Awaiting Client Response", "on Hold/Stuck"].includes(normalizeStatus(p.status)))
    : sortedProjects.filter((p) => normalizeStatus(p.status) === filterGroup);
  const flatTotalCount = displayedFlatProjects.length;
  const flatTotalPages = Math.ceil(flatTotalCount / FLAT_PAGE_SIZE) || 1;
  const safeFlatPage = Math.min(Math.max(1, flatPage), flatTotalPages);
  const flatPaginatedProjects = flatTotalCount > FLAT_PAGE_SIZE
    ? displayedFlatProjects.slice((safeFlatPage - 1) * FLAT_PAGE_SIZE, safeFlatPage * FLAT_PAGE_SIZE)
    : displayedFlatProjects;
  const flatStartItem = flatTotalCount === 0 ? 0 : (safeFlatPage - 1) * FLAT_PAGE_SIZE + 1;
  const flatEndItem = Math.min(safeFlatPage * FLAT_PAGE_SIZE, flatTotalCount);

  const renderSortableTh = (
    field: string,
    label: string,
    extraStyle: React.CSSProperties = {},
    isStickyLeft: boolean = false,
    customVar?: CustomVariable,
    fieldKey?: string
  ) => {
    const isCurrent = sortField === field;
    return (
      <th
        key={field}
        style={{
          ...styles.th,
          cursor: "pointer",
          userSelect: "none",
          background: isCurrent ? "#e0f2fe" : (isStickyLeft ? "#f8fafc" : "#f8fafc"),
          color: isCurrent ? "#0369a1" : "#475569",
          borderBottom: isCurrent ? "2.5px solid #0284c7" : "1.5px solid #e2e8f0",
          transition: "all 0.15s ease",
          ...extraStyle,
        }}
        onClick={() => handleSort(field)}
        title={`Sort by ${label} (${isCurrent ? (sortOrder === "asc" ? "Ascending" : "Descending") : "Click to sort"})`}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }} onClick={(e) => e.stopPropagation()}>
            <InlineEditableInput
              value={label}
              placeholder="Column name..."
              titleTooltip="Click to edit column title (Enter to save)"
              inputStyle={{
                fontWeight: 800,
                color: isCurrent ? "#0369a1" : "#475569",
                fontSize: "11px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                padding: "2px 4px",
                cursor: "pointer",
              }}
              onSave={async (newVal) => {
                if (customVar) {
                  return await handleUpdateCustomVariableName(customVar, newVal);
                } else if (fieldKey) {
                  return await handleUpdateFieldLabel(fieldKey, newVal);
                }
                return true;
              }}
            />
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            {field === "projectType" && isCurrent && sortProjectType !== "all" && (
              <span
                style={{
                  fontSize: "10px",
                  background: "#0284c7",
                  color: "#ffffff",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  textTransform: "none",
                  letterSpacing: "0",
                }}
                title={`Sorting target: ${sortProjectType}`}
              >
                🎯 {sortProjectType}
              </span>
            )}
            {field === "status" && isCurrent && sortBoardStatus !== "all" && (
              <span
                style={{
                  fontSize: "10.5px",
                  background: "#0284c7",
                  color: "#ffffff",
                  padding: "1px 6px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  textTransform: "none",
                  letterSpacing: "0",
                }}
                title={`Sorting target: ${getStatusLabel(sortBoardStatus)}`}
              >
                🎯 {getStatusLabel(sortBoardStatus)}
              </span>
            )}

            <span
              style={{
                fontSize: "11px",
                color: isCurrent ? "#0284c7" : "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {isCurrent ? (
                sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />
              ) : (
                <FaSort style={{ opacity: 0.35 }} />
              )}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (customVar) {
                  handleDeleteCustomVariableFromHeader(customVar);
                } else {
                  handleHideColumn(field, label);
                }
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px 4px",
                fontSize: "11px",
                borderRadius: "4px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.15s ease, background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#dc2626";
                e.currentTarget.style.background = "#fee2e2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#94a3b8";
                e.currentTarget.style.background = "transparent";
              }}
              title={customVar ? `Delete variable "${customVar.name}" from table` : `Remove column "${label}" from table`}
            >
              <FaTrash style={{ fontSize: "10px" }} />
            </button>
          </div>
        </div>
      </th>
    );
  };

  const adresseVariable = customVariables.find(
    (v) => v.key === "adresse" || v.name.toLowerCase() === "adresse"
  );
  const otherCustomVariables = customVariables.filter(
    (v) => v.key !== "adresse" && v.name.toLowerCase() !== "adresse"
  );

  const renderTableThead = () => (
    <thead>
      <tr style={{ borderBottom: "1.5px solid #e2e8f0" }}>
        {!hiddenColumns.includes("name") &&
          renderSortableTh(
            "name",
            getLabel("name", "Project Title"),
            {
              position: "sticky",
              left: 0,
              zIndex: 10,
              minWidth: "230px",
              boxShadow: "4px 0 10px -2px rgba(15, 23, 42, 0.08)",
              borderRight: "1px solid #e2e8f0",
            },
            true,
            undefined,
            "name"
          )}
        {/* ADRESSE (PLACED BEFORE PRIORITY) */}
        {adresseVariable &&
          !hiddenColumns.includes(`custom_${adresseVariable.key}`) &&
          !hiddenColumns.includes("custom_adresse") &&
          renderSortableTh(
            `custom_${adresseVariable.key}`,
            adresseVariable.name,
            { minWidth: "160px" },
            false,
            adresseVariable
          )}
        {!hiddenColumns.includes("priority") &&
          renderSortableTh("priority", getLabel("priority", "Priority"), {}, false, undefined, "priority")}
        {!hiddenColumns.includes("projectType") &&
          renderSortableTh("projectType", getLabel("projectType", "Type"), {}, false, undefined, "projectType")}
        {!hiddenColumns.includes("contractor") &&
          renderSortableTh("contractor", getLabel("contractor", "Contractor"), {}, false, undefined, "contractor")}
        {!hiddenColumns.includes("status") &&
          renderSortableTh("status", getLabel("status", "Status"), {}, false, undefined, "status")}
        {!hiddenColumns.includes("submittedDate") &&
          renderSortableTh("submittedDate", getLabel("submittedDate", "Submitted"), {}, false, undefined, "submittedDate")}
        {!hiddenColumns.includes("date") &&
          renderSortableTh("date", getLabel("date", "Target Date"), {}, false, undefined, "date")}
        {!hiddenColumns.includes("timeSpent") &&
          renderSortableTh("timeSpent", getLabel("timeSpent", "Time Spent"), {}, false, undefined, "timeSpent")}
        {!hiddenColumns.includes("targetDuration") &&
          renderSortableTh("targetDuration", getLabel("targetDuration", "Planned Duration"), {}, false, undefined, "targetDuration")}
        {!hiddenColumns.includes("pmName") &&
          renderSortableTh("pmName", getLabel("pmName", "PM Name"), {}, false, undefined, "pmName")}
        {!hiddenColumns.includes("pmEmails") &&
          renderSortableTh("pmEmails", getLabel("pmEmails", "PM Emails"), {}, false, undefined, "pmEmails")}
        {!hiddenColumns.includes("drafterName") &&
          renderSortableTh("drafterName", getLabel("drafterName", "Drafter"), {}, false, undefined, "drafterName")}
        {!hiddenColumns.includes("drafterEmails") &&
          renderSortableTh("drafterEmails", getLabel("drafterEmails", "Drafter Emails"), {}, false, undefined, "drafterEmails")}
        {!hiddenColumns.includes("structEngi") &&
          renderSortableTh("structEngi", getLabel("structEngi", "Struct Engi"), {}, false, undefined, "structEngi")}
        {!hiddenColumns.includes("seTime") &&
          renderSortableTh("seTime", getLabel("seTime", "SE Time"), {}, false, undefined, "seTime")}
        {!hiddenColumns.includes("pmStatus") &&
          renderSortableTh("pmStatus", getLabel("pmStatus", "PM Status"), {}, false, undefined, "pmStatus")}
        {!hiddenColumns.includes("draftingStatus") &&
          renderSortableTh("draftingStatus", getLabel("draftingStatus", "Drafting"), {}, false, undefined, "draftingStatus")}
        {!hiddenColumns.includes("qaAndDeliveryStatus") &&
          renderSortableTh("qaAndDeliveryStatus", getLabel("qaAndDeliveryStatus", "QA & Delivery"), {}, false, undefined, "qaAndDeliveryStatus")}
        {!hiddenColumns.includes("idReview") &&
          renderSortableTh("idReview", getLabel("idReview", "I&D Review"), {}, false, undefined, "idReview")}
        {!hiddenColumns.includes("peerReview") &&
          renderSortableTh("peerReview", getLabel("peerReview", "Peer Review"), {}, false, undefined, "peerReview")}
        {!hiddenColumns.includes("rfiStatus") &&
          renderSortableTh("rfiStatus", getLabel("rfiStatus", "RFI Status"), {}, false, undefined, "rfiStatus")}
        {!hiddenColumns.includes("projectSs") &&
          renderSortableTh("projectSs", getLabel("projectSs", "Site Survey (SS)"), {}, false, undefined, "projectSs")}
        {!hiddenColumns.includes("updates") &&
          renderSortableTh("updates", getLabel("updates", "Updates / Notes"), {}, false, undefined, "updates")}
        {/* OTHER DYNAMIC CUSTOM VARIABLES HEADERS */}
        {otherCustomVariables
          .filter((v) => !hiddenColumns.includes(`custom_${v.key}`))
          .map((v) =>
            renderSortableTh(
              `custom_${v.key}`,
              v.name,
              { minWidth: "140px" },
              false,
              v
            )
          )}
        {!hiddenColumns.includes("files") &&
          renderSortableTh("files", "Files", styles.thCenter)}
        {!hiddenColumns.includes("comments") &&
          renderSortableTh("comments", "Comments", styles.thCenter)}
        <th
          style={{
            ...styles.th,
            position: "sticky",
            right: 0,
            zIndex: 10,
            background: "#f8fafc",
            boxShadow: "-4px 0 10px -2px rgba(15, 23, 42, 0.08)",
            borderLeft: "1px solid #e2e8f0",
            textAlign: "right",
            minWidth: "115px",
          }}
        >
          <span>ACTIONS</span>
        </th>
      </tr>
    </thead>
  );

  const renderProjectRow = (project: ProjectDetail) => {
    const hasComments = project.comments && project.comments.length > 0;
    const isSelected = showDetails && selectedProjectId === project.id;
    const timeline = getProjectTimelineHighlight(project, workflowStatuses);
    const rowBg = isSelected
      ? "#eff6ff"
      : timeline.state === "red"
      ? "#fff5f5"
      : timeline.state === "yellow"
      ? "#fefce8"
      : "#ffffff";
    const cellHighlightBg = timeline.state === "red" ? "#fee2e2" : timeline.state === "yellow" ? "#fef9c3" : rowBg;

    return (
      <tr
        key={project.id}
        style={{
          ...styles.tr,
          background: rowBg,
          ...(isSelected ? styles.trActive : {}),
        }}
        onClick={() => {
          setSelectedProjectId(project.id);
          setShowDetails(true);
          setActiveTab("comments");
        }}
      >
        {/* 1. TITLE (STICKY LEFT) */}
        {!hiddenColumns.includes("name") && (
          <td
            style={{
              ...styles.td,
              ...styles.tdAccent,
              position: "sticky",
              left: 0,
              zIndex: 4,
              background: cellHighlightBg,
              boxShadow: timeline.state === "red"
                ? "inset 4px 0 0 0 #dc2626, 4px 0 10px -2px rgba(15, 23, 42, 0.08)"
                : timeline.state === "yellow"
                ? "inset 4px 0 0 0 #d97706, 4px 0 10px -2px rgba(15, 23, 42, 0.08)"
                : "inset 3px 0 0 0 #3b82f6, 4px 0 10px -2px rgba(15, 23, 42, 0.08)",
              borderRight: "1px solid #e2e8f0",
              minWidth: "230px",
              maxWidth: "280px",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <InlineEditableInput
                  value={project.name}
                  placeholder="Project title..."
                  titleTooltip="Click to edit project title (Enter to save)"
                  inputStyle={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "13px",
                    lineHeight: "18px",
                  }}
                  onSave={(newVal) => handleUpdateName(project, newVal)}
                />
              </div>
              <div style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {timeline.badgeBadge}
              </div>
            </div>
            <div style={{ marginTop: "2px" }}>
              <InlineEditableInput
                value={project.description || ""}
                placeholder="+ Add description..."
                titleTooltip="Click to edit description (Enter to save)"
                inputStyle={{
                  color: (project.description || "").trim() ? "#64748b" : "#94a3b8",
                  fontSize: "11.5px",
                  lineHeight: "16px",
                  fontStyle: (project.description || "").trim() ? "normal" : "italic",
                }}
                onSave={(newVal) => handleUpdateDescription(project, newVal)}
              />
            </div>
          </td>
        )}

        {/* ADRESSE (PLACED BEFORE PRIORITY) */}
        {adresseVariable &&
          !hiddenColumns.includes(`custom_${adresseVariable.key}`) &&
          !hiddenColumns.includes("custom_adresse") && (
            <td
              style={{
                ...styles.td,
                minWidth: "160px",
                background:
                  sortField === "custom_adresse" || sortField === `custom_${adresseVariable.key}`
                    ? "#f0f9ff"
                    : undefined,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                className="admin-table-input"
                defaultValue={project.customFields?.[adresseVariable.key] ?? project.customFields?.["adresse"] ?? ""}
                key={`custom-${project.id}-${adresseVariable.key}-${project.customFields?.[adresseVariable.key] ?? ""}`}
                placeholder="Enter address..."
                onBlur={(e) => {
                  const currentVal = project.customFields?.[adresseVariable.key] ?? project.customFields?.["adresse"] ?? "";
                  if (e.target.value !== currentVal) {
                    handleUpdateCustomField(project, adresseVariable.key, e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
            </td>
          )}

        {/* 2. PRIORITY */}
        {!hiddenColumns.includes("priority") && (
          <td style={styles.td}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 9px",
                borderRadius: "10px",
                fontSize: "11.5px",
                fontWeight: 700,
                ...getPriorityStyle(project.priority || "Medium"),
              }}
            >
              {project.priority || "Medium"}
            </span>
          </td>
        )}

        {/* 3. TYPE */}
        {!hiddenColumns.includes("projectType") && (
          <td
            style={{
              ...styles.td,
              minWidth: "160px",
              background:
                sortField === "projectType" &&
                sortProjectType !== "all" &&
                normalizeProjectTypes(project.projectType).some((t) => t.toLowerCase() === sortProjectType.toLowerCase())
                  ? "#f0fdf4"
                  : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectTypeMultiSelect
              value={project.projectType}
              onChange={(newTypes) => handleUpdateField(project, "projectType", newTypes)}
              compact={true}
            />
          </td>
        )}

        {/* 4. CONTRACTOR */}
        {!hiddenColumns.includes("contractor") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              className="admin-table-select"
              value={project.contractor?._id || ""}
              onChange={(e) => handleUpdateContractor(project, e.target.value)}
              style={{ maxWidth: "160px", textOverflow: "ellipsis" }}
              title="Change assigned contractor"
            >
              <option value="">Non assigné</option>
              {contractorsList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </td>
        )}

        {/* 5. STATUS */}
        {!hiddenColumns.includes("status") && (
          <td
            style={{
              ...styles.td,
              background:
                sortField === "status" &&
                sortBoardStatus !== "all" &&
                (normalizeStatus(project.status).toLowerCase() === sortBoardStatus.toLowerCase() ||
                  (project.status || "").toLowerCase() === sortBoardStatus.toLowerCase())
                  ? "#eff6ff"
                  : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <select
              className="admin-table-select"
              value={normalizeStatus(project.status)}
              onChange={(e) => handleUpdateStatus(project, e.target.value)}
              style={{ maxWidth: "170px", textOverflow: "ellipsis" }}
              title="Change project status"
            >
              {GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.title}
                </option>
              ))}
            </select>
          </td>
        )}

        {/* 6. SUBMITTED DATE */}
        {!hiddenColumns.includes("submittedDate") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="date"
              className="admin-table-input"
              max={getTodayDateString()}
              value={project.submittedDate || ""}
              onChange={(e) => handleUpdateField(project, "submittedDate", e.target.value)}
              style={{ width: "125px", cursor: "pointer" }}
              title="Submitted Date"
            />
          </td>
        )}

        {/* 7. TARGET DATE */}
        {!hiddenColumns.includes("date") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="date"
              className="admin-table-input"
              min={getTodayDateString()}
              value={project.date || ""}
              onChange={(e) => handleUpdateField(project, "date", e.target.value)}
              style={{ width: "125px", cursor: "pointer" }}
              title="Target Date"
            />
          </td>
        )}

        {/* TIME SPENT (TEMPS PASSÉ : AUJOURD'HUI - SUBMITTED DATE) */}
        {!hiddenColumns.includes("timeSpent") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                background:
                  timeline.state === "red"
                    ? "#fee2e2"
                    : timeline.state === "yellow"
                    ? "#fef9c3"
                    : "#f1f5f9",
                color:
                  timeline.state === "red"
                    ? "#dc2626"
                    : timeline.state === "yellow"
                    ? "#b45309"
                    : "#0369a1",
                border:
                  timeline.state === "red"
                    ? "1px solid #fca5a5"
                    : timeline.state === "yellow"
                    ? "1px solid #fde047"
                    : "1px solid #e2e8f0",
                whiteSpace: "nowrap",
              }}
              title={`Temps passé dans le projet : ${timeline.timeSpentLabel} (depuis ${project.submittedDate || "N/A"} jusqu'à aujourd'hui)`}
            >
              ⏱️ {timeline.timeSpentLabel}
            </span>
          </td>
        )}

        {/* TARGET DURATION (DURÉE PRÉVUE : TARGET DATE - SUBMITTED DATE) */}
        {!hiddenColumns.includes("targetDuration") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: "#f8fafc",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                whiteSpace: "nowrap",
              }}
              title={`Durée totale prévue : ${timeline.plannedDurationLabel} (du ${project.submittedDate || "N/A"} au ${project.date || "N/A"})`}
            >
              ⏳ {timeline.plannedDurationLabel}
            </span>
          </td>
        )}

        {/* 8. PM NAME */}
        {!hiddenColumns.includes("pmName") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              className="admin-table-input"
              value={
                mentionableUsers.find(
                  (u) =>
                    u.name.toLowerCase() === (project.pmName || "").toLowerCase() ||
                    u.email.toLowerCase() === (project.pmEmails || "").toLowerCase()
                )?.email || (project.pmName ? `custom:${project.pmName}` : "")
              }
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleUpdatePM(project, "");
                } else if (!val.startsWith("custom:")) {
                  handleUpdatePM(project, val);
                }
              }}
              style={{
                width: "135px",
                padding: "3px 6px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: project.pmName ? "#f0f9ff" : "#ffffff",
                color: project.pmName ? "#0369a1" : "#64748b",
                cursor: "pointer",
              }}
              title="Select Project Manager from users"
            >
              <option value="">-- No PM --</option>
              {mentionableUsers.map((u) => (
                <option key={u._id} value={u.email}>
                  {u.name} ({u.role})
                </option>
              ))}
              {project.pmName &&
                !mentionableUsers.some(
                  (u) =>
                    u.name.toLowerCase() === project.pmName?.toLowerCase() ||
                    u.email.toLowerCase() === project.pmEmails?.toLowerCase()
                ) && (
                  <option value={`custom:${project.pmName}`}>
                    {project.pmName} (Current)
                  </option>
                )}
            </select>
          </td>
        )}

        {/* 9. PM EMAILS */}
        {!hiddenColumns.includes("pmEmails") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              className="admin-table-input"
              value={
                mentionableUsers.find(
                  (u) =>
                    u.email.toLowerCase() === (project.pmEmails || "").toLowerCase() ||
                    u.name.toLowerCase() === (project.pmName || "").toLowerCase()
                )?.email || (project.pmEmails ? `custom:${project.pmEmails}` : "")
              }
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleUpdatePM(project, "");
                } else if (!val.startsWith("custom:")) {
                  handleUpdatePM(project, val);
                }
              }}
              style={{
                width: "155px",
                padding: "3px 6px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: project.pmEmails ? "#f8fafc" : "#ffffff",
                color: project.pmEmails ? "#334155" : "#64748b",
                cursor: "pointer",
              }}
              title="Select PM Email from users"
            >
              <option value="">-- No PM Email --</option>
              {mentionableUsers.map((u) => (
                <option key={u._id} value={u.email}>
                  {u.email} ({u.name})
                </option>
              ))}
              {project.pmEmails &&
                !mentionableUsers.some(
                  (u) =>
                    u.email.toLowerCase() === project.pmEmails?.toLowerCase() ||
                    u.name.toLowerCase() === project.pmName?.toLowerCase()
                ) && (
                  <option value={`custom:${project.pmEmails}`}>
                    {project.pmEmails} (Current)
                  </option>
                )}
            </select>
          </td>
        )}

        {/* 10. DRAFTER */}
        {!hiddenColumns.includes("drafterName") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              className="admin-table-input"
              value={
                mentionableUsers.find(
                  (u) =>
                    u.name.toLowerCase() === (project.drafterName || "").toLowerCase() ||
                    u.email.toLowerCase() === (project.drafterEmails || "").toLowerCase()
                )?.email || (project.drafterName ? `custom:${project.drafterName}` : "")
              }
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleUpdateDrafter(project, "");
                } else if (!val.startsWith("custom:")) {
                  handleUpdateDrafter(project, val);
                }
              }}
              style={{
                width: "135px",
                padding: "3px 6px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: project.drafterName ? "#f0fdf4" : "#ffffff",
                color: project.drafterName ? "#166534" : "#64748b",
                cursor: "pointer",
              }}
              title="Select Drafter from users"
            >
              <option value="">-- No Drafter --</option>
              {mentionableUsers.map((u) => (
                <option key={u._id} value={u.email}>
                  {u.name} ({u.role})
                </option>
              ))}
              {project.drafterName &&
                !mentionableUsers.some(
                  (u) =>
                    u.name.toLowerCase() === project.drafterName?.toLowerCase() ||
                    u.email.toLowerCase() === project.drafterEmails?.toLowerCase()
                ) && (
                  <option value={`custom:${project.drafterName}`}>
                    {project.drafterName} (Current)
                  </option>
                )}
            </select>
          </td>
        )}

        {/* 11. DRAFTER EMAILS */}
        {!hiddenColumns.includes("drafterEmails") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              className="admin-table-input"
              value={
                mentionableUsers.find(
                  (u) =>
                    u.email.toLowerCase() === (project.drafterEmails || "").toLowerCase() ||
                    u.name.toLowerCase() === (project.drafterName || "").toLowerCase()
                )?.email || (project.drafterEmails ? `custom:${project.drafterEmails}` : "")
              }
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  handleUpdateDrafter(project, "");
                } else if (!val.startsWith("custom:")) {
                  handleUpdateDrafter(project, val);
                }
              }}
              style={{
                width: "155px",
                padding: "3px 6px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                background: project.drafterEmails ? "#f8fafc" : "#ffffff",
                color: project.drafterEmails ? "#334155" : "#64748b",
                cursor: "pointer",
              }}
              title="Select Drafter Email from users"
            >
              <option value="">-- No Drafter Email --</option>
              {mentionableUsers.map((u) => (
                <option key={u._id} value={u.email}>
                  {u.email} ({u.name})
                </option>
              ))}
              {project.drafterEmails &&
                !mentionableUsers.some(
                  (u) =>
                    u.email.toLowerCase() === project.drafterEmails?.toLowerCase() ||
                    u.name.toLowerCase() === project.drafterName?.toLowerCase()
                ) && (
                  <option value={`custom:${project.drafterEmails}`}>
                    {project.drafterEmails} (Current)
                  </option>
                )}
            </select>
          </td>
        )}

        {/* 12. STRUCT ENGI */}
        {!hiddenColumns.includes("structEngi") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <select
              value={project.structEngi || "Choose"}
              onChange={(e) => handleUpdateField(project, "structEngi", e.target.value)}
              style={{
                padding: "4px 8px",
                borderRadius: "8px",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                outline: "none",
                border: "1.5px solid",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                ...getStructEngiBadgeStyle(project.structEngi || "Choose"),
              }}
              title="Update Struct Engi status"
            >
              {Array.from(new Set([project.structEngi || "Choose", ...STRUCT_ENGI_OPTIONS]))
                .filter(Boolean)
                .map((opt) => (
                  <option key={opt} value={opt} style={{ background: "#ffffff", color: "#0f172a", fontWeight: 500 }}>
                    {opt}
                  </option>
                ))}
            </select>
          </td>
        )}

        {/* 13. SE TIME */}
        {!hiddenColumns.includes("seTime") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.seTime || ""}
              placeholder="SE Time..."
              onBlur={(e) => {
                if (e.target.value !== (project.seTime || "")) {
                  handleUpdateField(project, "seTime", e.target.value);
                }
              }}
              style={{ width: "85px" }}
            />
          </td>
        )}

        {/* 14. PM STATUS */}
        {!hiddenColumns.includes("pmStatus") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.pmStatus || ""}
              placeholder="PM Status..."
              onBlur={(e) => {
                if (e.target.value !== (project.pmStatus || "")) {
                  handleUpdateField(project, "pmStatus", e.target.value);
                }
              }}
              style={{ width: "105px" }}
            />
          </td>
        )}

        {/* 15. DRAFTING STATUS */}
        {!hiddenColumns.includes("draftingStatus") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.draftingStatus || ""}
              placeholder="Drafting Status..."
              onBlur={(e) => {
                if (e.target.value !== (project.draftingStatus || "")) {
                  handleUpdateField(project, "draftingStatus", e.target.value);
                }
              }}
              style={{ width: "115px" }}
            />
          </td>
        )}

        {/* 16. QA & DELIVERY */}
        {!hiddenColumns.includes("qaAndDeliveryStatus") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.qaAndDeliveryStatus || ""}
              placeholder="QA & Delivery..."
              onBlur={(e) => {
                if (e.target.value !== (project.qaAndDeliveryStatus || "")) {
                  handleUpdateField(project, "qaAndDeliveryStatus", e.target.value);
                }
              }}
              style={{ width: "125px" }}
            />
          </td>
        )}

        {/* 17. I&D REVIEW */}
        {!hiddenColumns.includes("idReview") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.idReview || ""}
              placeholder="I&D Review..."
              onBlur={(e) => {
                if (e.target.value !== (project.idReview || "")) {
                  handleUpdateField(project, "idReview", e.target.value);
                }
              }}
              style={{ width: "105px" }}
            />
          </td>
        )}

        {/* 18. PEER REVIEW */}
        {!hiddenColumns.includes("peerReview") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.peerReview || ""}
              placeholder="Peer Review..."
              onBlur={(e) => {
                if (e.target.value !== (project.peerReview || "")) {
                  handleUpdateField(project, "peerReview", e.target.value);
                }
              }}
              style={{ width: "105px" }}
            />
          </td>
        )}

        {/* 19. RFI STATUS */}
        {!hiddenColumns.includes("rfiStatus") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.rfiStatus || ""}
              placeholder="RFI Status..."
              onBlur={(e) => {
                if (e.target.value !== (project.rfiStatus || "")) {
                  handleUpdateField(project, "rfiStatus", e.target.value);
                }
              }}
              style={{ width: "105px" }}
            />
          </td>
        )}

        {/* 20. PROJECT SS */}
        {!hiddenColumns.includes("projectSs") && (
          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              className="admin-table-input"
              defaultValue={project.projectSs || ""}
              placeholder="Site Survey..."
              onBlur={(e) => {
                if (e.target.value !== (project.projectSs || "")) {
                  handleUpdateField(project, "projectSs", e.target.value);
                }
              }}
              style={{ width: "105px" }}
            />
          </td>
        )}

        {/* 21. UPDATES */}
        {!hiddenColumns.includes("updates") && (
          <td style={styles.td}>
            {project.updates ? (
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "200px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  color: "#334155",
                  background: "#f1f5f9",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
                title={project.updates}
              >
                📝 {project.updates}
              </span>
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
            )}
          </td>
        )}

        {/* OTHER DYNAMIC CUSTOM VARIABLES CELLS */}
        {otherCustomVariables
          .filter((v) => !hiddenColumns.includes(`custom_${v.key}`))
          .map((v) => {
            const val = project.customFields?.[v.key] ?? "";
            return (
              <td key={v._id} style={{ ...styles.td, minWidth: "140px" }} onClick={(e) => e.stopPropagation()}>
                {v.type === "number" ? (
                  <input
                    type="number"
                    className="admin-table-input"
                    defaultValue={val}
                    key={`custom-${project.id}-${v.key}-${val}`}
                    placeholder="0"
                    onBlur={(e) => {
                      const numVal = e.target.value === "" ? "" : Number(e.target.value);
                      if (numVal !== val) {
                        handleUpdateCustomField(project, v.key, numVal);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                ) : v.type === "date" ? (
                  <input
                    type="date"
                    className="admin-table-input"
                    defaultValue={val ? String(val).slice(0, 10) : ""}
                    key={`custom-${project.id}-${v.key}-${val}`}
                    onChange={(e) => {
                      handleUpdateCustomField(project, v.key, e.target.value);
                    }}
                  />
                ) : (
                  <input
                    type="text"
                    className="admin-table-input"
                    defaultValue={val}
                    key={`custom-${project.id}-${v.key}-${val}`}
                    placeholder="Enter text..."
                    onBlur={(e) => {
                      if (e.target.value !== val) {
                        handleUpdateCustomField(project, v.key, e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />
                )}
              </td>
            );
          })}

        {/* 22. FILES */}
        {!hiddenColumns.includes("files") && (
          <td style={{ ...styles.tdCenter, fontSize: "12.5px" }}>
            {(project.files?.length || 0) + (project.images?.length || 0) > 0 ? (
              <span style={{ color: "#0284c7", fontWeight: 700 }}>
                📎 {(project.files?.length || 0) + (project.images?.length || 0)}
              </span>
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>0</span>
            )}
          </td>
        )}

        {/* 23. COMMENTS */}
        {!hiddenColumns.includes("comments") && (
          <td style={{ ...styles.tdCenter, fontSize: "12.5px" }}>
            {hasComments ? (
              <span style={{ color: "#0f172a", fontWeight: 700 }}>
                💬 {project.comments.length}
              </span>
            ) : (
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>0</span>
            )}
          </td>
        )}

        {/* 24. ACTIONS (STICKY RIGHT) */}
        <td
          style={{
            ...styles.td,
            position: "sticky",
            right: 0,
            zIndex: 4,
            background: rowBg,
            boxShadow: "-4px 0 10px -2px rgba(15, 23, 42, 0.08)",
            borderLeft: "1px solid #e2e8f0",
            textAlign: "right",
            minWidth: "115px",
          }}
        >
          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <button
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                color: "#0284c7",
                cursor: "pointer",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onClick={() => handleEdit(project)}
              title="Edit project"
            >
              <FaPencilAlt />
            </button>

            <button
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#475569",
                cursor: "pointer",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onClick={() => {
                setSelectedProjectId(project.id);
                setShowDetails(true);
              }}
              title="View details"
            >
              <FaEye />
            </button>

            {effectivePermissions.canDeleteProjects && (
              <button
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "7px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onClick={() => handleDelete(project.id, project.name)}
                title="Delete project"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="admin-container">
      {/* HEADER SECTION */}
      <div className="admin-header-card">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-main-title">
              {activeView === "projects"
                ? "Projects Management"
                : activeView === "contractors"
                ? "Contractors Management"
                : activeView === "invoices"
                ? "Invoices Management"
                : activeView === "interconnection"
                ? "Interconnection Management"
                : "Users & Permissions"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px", flexWrap: "wrap" }}>
              <p className="admin-subtitle" style={{ margin: 0 }}>
                Welcome, <strong>{user?.name}</strong>!
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "3px 10px",
                  borderRadius: "14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: user?.role === "admin" ? "#fef3c7" : "#e0f2fe",
                  color: user?.role === "admin" ? "#b45309" : "#0284c7",
                  border: `1px solid ${user?.role === "admin" ? "#fde68a" : "#bfdbfe"}`,
                }}
              >
                {user?.role === "admin" ? <FaCrown style={{ fontSize: "11px" }} /> : <FaUserShield style={{ fontSize: "11px" }} />}
                {user?.role === "admin" ? "Super Admin" : "Sub-Admin"}
              </span>
            </div>
          </div>
          <div className="admin-header-actions">
            <div className="admin-view-switch">
              {effectivePermissions.canViewProjects && (
                <button
                  className={`admin-view-switch-btn ${activeView === "projects" ? "active" : ""}`}
                  onClick={() => setActiveView("projects")}
                >
                  Projects
                </button>
              )}
              {effectivePermissions.canViewContractors && (
                <button
                  className={`admin-view-switch-btn ${activeView === "contractors" ? "active" : ""}`}
                  onClick={() => setActiveView("contractors")}
                >
                  Contractors
                </button>
              )}
              {effectivePermissions.canViewInvoices && (
                <button
                  className={`admin-view-switch-btn ${activeView === "invoices" ? "active" : ""}`}
                  onClick={() => setActiveView("invoices")}
                >
                  <FaFileInvoiceDollar style={{ marginRight: "4px" }} /> Invoices
                </button>
              )}
              {effectivePermissions.canViewInterconnection && (
                <button
                  className={`admin-view-switch-btn ${activeView === "interconnection" ? "active" : ""}`}
                  onClick={() => setActiveView("interconnection")}
                >
                  <FaNetworkWired style={{ marginRight: "4px" }} /> Interconnection
                </button>
              )}
              {currentUser?.role === "admin" && (
                <button
                  className={`admin-view-switch-btn ${activeView === "subadmins" ? "active" : ""}`}
                  onClick={() => setActiveView("subadmins")}
                >
                  <FaUserShield style={{ marginRight: "4px" }} /> Users & Permissions
                </button>
              )}
            </div>
            {/* NOTIFICATION CENTER */}
            <NotificationCenter
              onProjectEvent={() => {
                fetchProjectsList();
              }}
              onSelectProject={(projectId, notif) => {
                setSelectedProjectId(projectId);
                setShowDetails(true);
                if (notif?.type === "mention") {
                  setActiveTab("comments");
                }
              }}
            />

            {activeView === "projects" && (
              <>
                <button
                  className="admin-btn-outline"
                  onClick={() => setShowVariablesModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ffffff",
                    borderColor: "#cbd5e1",
                    color: "#334155",
                    fontWeight: 600,
                  }}
                  title="Add dynamic variable / column to table"
                >
                  <FaColumns style={{ color: "#2563eb" }} /> Add Variable
                </button>

                <button
                  className="admin-btn-outline"
                  onClick={() => setShowManageColumnsModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: hiddenColumns.length > 0 ? "#eff6ff" : "#ffffff",
                    borderColor: hiddenColumns.length > 0 ? "#93c5fd" : "#cbd5e1",
                    color: hiddenColumns.length > 0 ? "#1d4ed8" : "#334155",
                    fontWeight: 600,
                  }}
                  title="Manage columns and restore removed ones"
                >
                  <FaColumns style={{ color: hiddenColumns.length > 0 ? "#2563eb" : "#64748b" }} />
                  Columns {hiddenColumns.length > 0 ? `(${hiddenColumns.length} hidden)` : ""}
                </button>

                {effectivePermissions.canCreateProjects && (
                  <button className="admin-btn-primary" onClick={() => setShowForm(true)}>
                    <FaPlus /> Add Project
                  </button>
                )}
              </>
            )}
            <button className="admin-btn-outline" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {activeView === "contractors" ? (
        <Contractors
          onSelectProject={(projectId) => {
            setActiveView("projects");
            setSelectedProjectId(projectId);
            setShowDetails(true);
          }}
        />
      ) : activeView === "invoices" ? (
        <Invoices
          canEdit={effectivePermissions.canEditInvoices}
          onSelectProject={(projectId) => {
            setActiveView("projects");
            setSelectedProjectId(projectId);
            setShowDetails(true);
          }}
        />
      ) : activeView === "interconnection" ? (
        <Interconnection
          canEdit={effectivePermissions.canEditInterconnection}
          onSelectProject={(projectId) => {
            setActiveView("projects");
            setSelectedProjectId(projectId);
            setShowDetails(true);
          }}
        />
      ) : activeView === "subadmins" && currentUser?.role === "admin" ? (
        <Subadmins currentUser={currentUser} />
      ) : (
        <>
        {/* ASSIGNED PROJECTS NOTICE BANNER */}
        {effectivePermissions.projectAccess === "assigned" && currentUser?.role !== "admin" && (
          <div
            style={{
              padding: "12px 18px",
              background: "#fff7ed",
              border: "1.5px solid #fed7aa",
              borderRadius: "12px",
              color: "#9a3412",
              fontSize: "13.5px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 2px 6px rgba(234, 88, 12, 0.05)",
            }}
          >
            <span style={{ fontSize: "18px" }}>👤</span>
            <div>
              <strong>Restricted Visibility Mode:</strong> Only projects where you are assigned as Project Manager (PM) or Drafter are displayed.
            </div>
          </div>
        )}
      {/* STATS SECTION */}
      <div className="admin-stats-grid">
        <div
          className={`admin-stat-card ${filterGroup === "all" ? "active-card" : ""}`}
          onClick={() => handleStatCardClick("all")}
          title="Click to view all projects"
        >
          <div className="admin-stat-icon" style={{ background: "rgba(255, 110, 0, 0.1)", color: "#ff6e00" }}>
            📊
          </div>
          <h3 className="admin-stat-title">Total</h3>
          <p className="admin-stat-value">{totalProjects}</p>
          <p className="admin-stat-desc">Total projects · Click to view all</p>
        </div>

        <div
          className={`admin-stat-card ${filterGroup === "Project Processing" ? "active-card" : ""}`}
          onClick={() => handleStatCardClick("processing")}
          title="Click to view Project Processing table"
        >
          <div className="admin-stat-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
            <FaClock style={{ color: "#2563eb" }} />
          </div>
          <h3 className="admin-stat-title">Processing</h3>
          <p className="admin-stat-value" style={{ color: "#2563eb" }}>{processingCount}</p>
          <p className="admin-stat-desc">Currently active · Click to view table</p>
        </div>

        <div
          className={`admin-stat-card ${filterGroup === "awaiting_on_hold" ? "active-card" : ""}`}
          onClick={() => handleStatCardClick("awaiting")}
          title="Click to view Awaiting & On Hold tables"
        >
          <div className="admin-stat-icon" style={{ background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}>
            <FaHourglassEnd style={{ color: "#dc2626" }} />
          </div>
          <h3 className="admin-stat-title">Awaiting / On Hold</h3>
          <p className="admin-stat-value" style={{ color: "#dc2626" }}>{awaitingCount}</p>
          <p className="admin-stat-desc">Needs attention · Click to view table</p>
        </div>

        <div
          className={`admin-stat-card ${filterGroup === "Completed" ? "active-card" : ""}`}
          onClick={() => handleStatCardClick("completed")}
          title="Click to view Completed table"
        >
          <div className="admin-stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
            <FaCheckCircle style={{ color: "#10b981" }} />
          </div>
          <h3 className="admin-stat-title">Completed</h3>
          <p className="admin-stat-value" style={{ color: "#10b981" }}>{completedCount}</p>
          <p className="admin-stat-desc">Finished projects · Click to view table</p>
        </div>
      </div>

      {/* CUSTOM DYNAMIC VARIABLES MODAL */}
      <CustomVariablesModal
        isOpen={showVariablesModal}
        onClose={() => setShowVariablesModal(false)}
        variables={customVariables}
        onVariablesChange={setCustomVariables}
      />

      {/* MANAGE COLUMNS & RESTORE HIDDEN MODAL */}
      <ManageColumnsModal
        isOpen={showManageColumnsModal}
        onClose={() => setShowManageColumnsModal(false)}
        hiddenColumns={hiddenColumns}
        onToggleColumn={handleToggleColumnVisibility}
        onResetAll={handleResetAllColumns}
        customVariables={customVariables}
        fieldLabels={fieldLabels}
      />

      {/* FORM MODAL */}
      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "760px", width: "95%", maxHeight: "92vh", overflowY: "auto", padding: "28px" }}>
            <div style={styles.formHeader}>
              <div>
                <h3 style={styles.formTitle}>
                  {editingId ? "✏️ Edit Project" : "➕ New Project"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Fill in the project details across the tabs below
                </p>
              </div>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            {/* MODAL TABS */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", overflowX: "auto" }}>
              {[
                { id: "general", label: "📌 General Info" },
                { id: "team", label: "👥 Team & Contacts" },
                { id: "workflow", label: "⚡ Statuses & Reviews" },
                { id: "engineering", label: "⏱️ Engineering & Updates" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setModalTab(t.id as any)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: "none",
                    background: modalTab === t.id ? "#0ea5e9" : "#f1f5f9",
                    color: modalTab === t.id ? "#fff" : "#475569",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB 1: GENERAL */}
            {modalTab === "general" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("name", "Project Name")} *</label>
                <input
                  type="text"
                  placeholder="e.g. Dupont, Jean-Pierre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    ...styles.input,
                    borderColor: isDuplicateProjectName ? "#ef4444" : undefined,
                    background: isDuplicateProjectName ? "#fff1f2" : "#ffffff",
                    marginBottom: isDuplicateProjectName ? "6px" : "16px",
                  }}
                />
                {isDuplicateProjectName && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#b91c1c",
                      fontSize: "12px",
                      fontWeight: 700,
                      marginBottom: "14px",
                      padding: "6px 10px",
                      borderRadius: "8px",
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                    }}
                  >
                    <span>⚠️</span>
                    <span>A project named "{formData.name.trim()}" already exists in the table.</span>
                  </div>
                )}

                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                  {getLabel("description", "Project Description")}
                  <span style={{ fontSize: "11px", fontWeight: 400, color: "#94a3b8", marginLeft: "6px" }}>(Optional)</span>
                </label>
                <textarea
                  placeholder="Project specs, system size, equipment details... (optional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.textarea}
                  rows={3}
                />

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("contractor", "Contractor")}</label>
                    <select
                      value={formData.contractor}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      style={styles.input}
                    >
                      <option value="">Select a contractor</option>
                      {contractorsList.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("status", "Board Status")}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={styles.input}
                    >
                      {GROUPS.map((g) => (
                        <option key={g.key} value={g.key}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {adresseVariable && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                      {adresseVariable.name}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Rue de Paris, 75001 Paris"
                      value={formData.customFields?.[adresseVariable.key] ?? formData.customFields?.["adresse"] ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customFields: {
                            ...(formData.customFields || {}),
                            [adresseVariable.key]: e.target.value,
                          },
                        })
                      }
                      style={styles.input}
                    />
                  </div>
                )}

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("priority", "Priority")}</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={styles.input}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("projectType", "Project Type")}</label>
                    <ProjectTypeMultiSelect
                      value={formData.projectType}
                      onChange={(newTypes) => setFormData({ ...formData, projectType: newTypes })}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                      {getLabel("submittedDate", "Submitted Date")}
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", marginLeft: "6px" }}>(Aujourd'hui ou passé)</span>
                    </label>
                    <input
                      type="date"
                      max={getTodayDateString()}
                      value={formData.submittedDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const today = getTodayDateString();
                        if (val && val > today) {
                          alert("La date de soumission ne peut pas être dans le futur.");
                          return;
                        }
                        setFormData({ ...formData, submittedDate: val });
                      }}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                      {getLabel("date", "Target Date")} *
                      <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b", marginLeft: "6px" }}>(Aujourd'hui ou futur)</span>
                    </label>
                    <input
                      type="date"
                      min={getTodayDateString()}
                      value={formData.date}
                      onChange={(e) => {
                        const val = e.target.value;
                        const today = getTodayDateString();
                        if (val && val < today) {
                          alert("La date cible (Target Date) ne peut pas être dans le passé.");
                          return;
                        }
                        setFormData({ ...formData, date: val });
                      }}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEAM */}
            {modalTab === "team" && (
              <div>
                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("pmName", "PM Name")}</label>
                    <select
                      value={
                        mentionableUsers.find(
                          (u) =>
                            u.name.toLowerCase() === (formData.pmName || "").toLowerCase() ||
                            u.email.toLowerCase() === (formData.pmEmails || "").toLowerCase()
                        )?.email || ""
                      }
                      onChange={(e) => {
                        const email = e.target.value;
                        const user = mentionableUsers.find((u) => u.email === email);
                        if (user) {
                          setFormData({ ...formData, pmName: user.name, pmEmails: user.email });
                        } else {
                          setFormData({ ...formData, pmName: "", pmEmails: "" });
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="">-- Select PM User --</option>
                      {mentionableUsers.map((u) => (
                        <option key={u._id} value={u.email}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("pmEmails", "PM Emails")}</label>
                    <select
                      value={
                        mentionableUsers.find(
                          (u) =>
                            u.email.toLowerCase() === (formData.pmEmails || "").toLowerCase() ||
                            u.name.toLowerCase() === (formData.pmName || "").toLowerCase()
                        )?.email || ""
                      }
                      onChange={(e) => {
                        const email = e.target.value;
                        const user = mentionableUsers.find((u) => u.email === email);
                        if (user) {
                          setFormData({ ...formData, pmName: user.name, pmEmails: user.email });
                        } else {
                          setFormData({ ...formData, pmName: "", pmEmails: "" });
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="">-- Select PM Email --</option>
                      {mentionableUsers.map((u) => (
                        <option key={u._id} value={u.email}>
                          {u.email} ({u.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("drafterName", "Drafter Name")}</label>
                    <select
                      value={
                        mentionableUsers.find(
                          (u) =>
                            u.name.toLowerCase() === (formData.drafterName || "").toLowerCase() ||
                            u.email.toLowerCase() === (formData.drafterEmails || "").toLowerCase()
                        )?.email || ""
                      }
                      onChange={(e) => {
                        const email = e.target.value;
                        const user = mentionableUsers.find((u) => u.email === email);
                        if (user) {
                          setFormData({ ...formData, drafterName: user.name, drafterEmails: user.email });
                        } else {
                          setFormData({ ...formData, drafterName: "", drafterEmails: "" });
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="">-- Select Drafter User --</option>
                      {mentionableUsers.map((u) => (
                        <option key={u._id} value={u.email}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("drafterEmails", "Drafter Emails")}</label>
                    <select
                      value={
                        mentionableUsers.find(
                          (u) =>
                            u.email.toLowerCase() === (formData.drafterEmails || "").toLowerCase() ||
                            u.name.toLowerCase() === (formData.drafterName || "").toLowerCase()
                        )?.email || ""
                      }
                      onChange={(e) => {
                        const email = e.target.value;
                        const user = mentionableUsers.find((u) => u.email === email);
                        if (user) {
                          setFormData({ ...formData, drafterName: user.name, drafterEmails: user.email });
                        } else {
                          setFormData({ ...formData, drafterName: "", drafterEmails: "" });
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="">-- Select Drafter Email --</option>
                      {mentionableUsers.map((u) => (
                        <option key={u._id} value={u.email}>
                          {u.email} ({u.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>
                    {getLabel("structEngi", "Struct Engi")}
                  </label>
                  <select
                    value={formData.structEngi || "Choose"}
                    onChange={(e) => setFormData({ ...formData, structEngi: e.target.value })}
                    style={{
                      ...styles.input,
                      fontWeight: 600,
                      ...getStructEngiBadgeStyle(formData.structEngi || "Choose"),
                    }}
                  >
                    {STRUCT_ENGI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#ffffff", color: "#0f172a", fontWeight: 500 }}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* TAB 3: WORKFLOW */}
            {modalTab === "workflow" && (
              <div>
                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("pmStatus", "PM Status")}</label>
                    <input
                      type="text"
                      placeholder="e.g. In Review, Client Action, Approved..."
                      value={formData.pmStatus}
                      onChange={(e) => setFormData({ ...formData, pmStatus: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("draftingStatus", "Drafting Status")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Not Started, In Progress, Revisions, Completed..."
                      value={formData.draftingStatus}
                      onChange={(e) => setFormData({ ...formData, draftingStatus: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("qaAndDeliveryStatus", "QA and Delivery Status")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Pending QA, QA Passed, Delivered..."
                      value={formData.qaAndDeliveryStatus}
                      onChange={(e) => setFormData({ ...formData, qaAndDeliveryStatus: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("rfiStatus", "RFI Status")}</label>
                    <input
                      type="text"
                      placeholder="e.g. No RFI, RFI Sent, RFI Received..."
                      value={formData.rfiStatus}
                      onChange={(e) => setFormData({ ...formData, rfiStatus: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("idReview", "I&D Review")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Pending, In Review, Approved..."
                      value={formData.idReview}
                      onChange={(e) => setFormData({ ...formData, idReview: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("peerReview", "Peer Review")}</label>
                    <input
                      type="text"
                      placeholder="e.g. Not Started, In Review, Passed..."
                      value={formData.peerReview}
                      onChange={(e) => setFormData({ ...formData, peerReview: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ENGINEERING */}
            {modalTab === "engineering" && (
              <div>
                <div className="admin-form-row">
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("seTime", "SE Time (Engineer Time / Turnaround)")}</label>
                    <input
                      type="text"
                      placeholder="e.g. 2h, 1 day, 48h..."
                      value={formData.seTime}
                      onChange={(e) => setFormData({ ...formData, seTime: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("projectSs", "Project SS (Site Survey / Specs)")}</label>
                    <input
                      type="text"
                      placeholder="Site survey link, notes, or status..."
                      value={formData.projectSs}
                      onChange={(e) => setFormData({ ...formData, projectSs: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "5px" }}>{getLabel("updates", "Updates (Latest status notes / Communications)")}</label>
                  <textarea
                    placeholder="Latest updates, discussions, client requests, blocker notes..."
                    value={formData.updates}
                    onChange={(e) => setFormData({ ...formData, updates: e.target.value })}
                    style={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="admin-form-actions">
              <button
                style={{
                  ...styles.saveBtn,
                  opacity: isDuplicateProjectName ? 0.6 : 1,
                  cursor: isDuplicateProjectName ? "not-allowed" : "pointer",
                }}
                onClick={handleSave}
                disabled={isDuplicateProjectName}
                title={isDuplicateProjectName ? "A project with this name already exists" : ""}
              >
                {editingId ? "Update Project" : "Create Project"}
              </button>
              <button style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE + DETAILS PANEL */}
      <div className="admin-main-layout">
        <div className="admin-projects-section">
          {/* MODERN TOOLBAR: EXPORTS & SEARCH BAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              padding: "12px 16px",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            {/* EXPORT BUTTONS */}
            {effectivePermissions.canExportProjects && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "4px" }}>
                  Export:
                </span>
                <button
                  style={{
                    background: "#f0fdf4",
                    color: "#16a34a",
                    border: "1px solid #bbf7d0",
                    padding: "6px 13px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 2px rgba(22, 163, 74, 0.05)",
                  }}
                  onClick={handleExportCSV}
                  title="Export projects to CSV"
                >
                  <FaDownload style={{ fontSize: "11px" }} /> CSV
                </button>
                <button
                  style={{
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    padding: "6px 13px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 2px rgba(220, 38, 38, 0.05)",
                  }}
                  onClick={handleExportPDF}
                  title="Export projects to PDF"
                >
                  <FaFilePdf style={{ fontSize: "11px" }} /> PDF
                </button>
                <button
                  style={{
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe",
                    padding: "6px 13px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.2s ease",
                    boxShadow: "0 1px 2px rgba(124, 58, 237, 0.05)",
                  }}
                  onClick={handleExportAllUploadedFilesZip}
                  title="Download all attached files (ZIP)"
                >
                  <FaFileArchive style={{ fontSize: "11px" }} /> ZIP
                </button>
              </div>
            )}

            {/* SLEEK & MODERN SEARCH BAR */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                background: isSearchFocused ? "#ffffff" : "#f8fafc",
                border: isSearchFocused ? "1.5px solid #ff6e00" : "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "6px 12px 6px 10px",
                width: "100%",
                maxWidth: "420px",
                minWidth: "260px",
                boxShadow: isSearchFocused
                  ? "0 0 0 4px rgba(255, 110, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05)"
                  : "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                gap: "8px",
              }}
            >
              {/* SEARCH ICON BADGE */}
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: isSearchFocused ? "#fff7ed" : "#edf2f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isSearchFocused ? "#ea580c" : "#64748b",
                  flexShrink: 0,
                  transition: "all 0.2s ease",
                }}
              >
                <FaSearch style={{ fontSize: "11px" }} />
              </div>

              {/* INPUT */}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by project, contractor, date..."
                value={searchTerm}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: "13px",
                  color: "#0f172a",
                  fontWeight: 500,
                  background: "transparent",
                  fontFamily: "inherit",
                }}
              />

              {/* RIGHT SIDE (BADGE OR SHORTCUT) */}
              {searchTerm ? (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <span
                    style={{
                      background: "#ffedd5",
                      color: "#9a3412",
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sortedProjects.length}
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      color: "#475569",
                      cursor: "pointer",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "9px",
                      padding: 0,
                      transition: "all 0.15s ease",
                    }}
                    title="Clear search"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <kbd
                  onClick={() => searchInputRef.current?.focus()}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "5px",
                    padding: "2px 6px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    userSelect: "none",
                    flexShrink: 0,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                  }}
                  title="Keyboard shortcut"
                >
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          {/* MULTI-SERVICE WORKFLOW BAR & TIMERS CONFIG */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
              background: "#ffffff",
              padding: "10px 16px",
              borderRadius: "12px",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: "11.5px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Service Workflow:
              </span>
              {[
                { id: "Plan Set Design", label: "📐 Plan Set Design" },
                { id: "Online Permit Application", label: "🏛️ Online Permit Application" },
                { id: "Utility Interconnection / PTO", label: "⚡ Utility Interconnection / PTO" },
              ].map((srv) => {
                const isActive = activeService === srv.id;
                return (
                  <button
                    key={srv.id}
                    onClick={() => {
                      setActiveService(srv.id);
                      setFilterGroup("all");
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: isActive ? "1.5px solid #0284c7" : "1px solid #e2e8f0",
                      background: isActive ? "#f0f9ff" : "#f8fafc",
                      color: isActive ? "#0369a1" : "#475569",
                      fontWeight: isActive ? 700 : 600,
                      fontSize: "12.5px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{srv.label}</span>
                    {isActive && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "#0284c7",
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowStatusSettingsModal(true)}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1.5px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
              title="Configure stages, names, and yellow/red deadline timers"
            >
              <FaCog style={{ color: "#64748b", fontSize: "13px" }} />
              <span>⚙️ Timers & Stages</span>
            </button>
          </div>

          {/* GLOBAL SORT & VIEW LAYOUT TOOLBAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              padding: "10px 16px",
              marginBottom: "16px",
              background: "#ffffff",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              flexWrap: "wrap",
            }}
          >
            {/* LEFT: SORT CONTROLS */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155", fontSize: "13px", fontWeight: 700 }}>
                <FaSort style={{ color: "#0284c7", fontSize: "14px" }} />
                <span>Sort by:</span>
              </div>

              {/* Sort field select */}
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1.5px solid #cbd5e1",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  outline: "none",
                }}
                title="Select sort field"
              >
                {SORT_OPTIONS.map((opt) => {
                  if (opt.field === "priority") {
                    return (
                      <Fragment key="sort-adresse-priority-group">
                        <option value={adresseVariable ? `custom_${adresseVariable.key}` : "custom_adresse"}>
                          {adresseVariable ? adresseVariable.name : "Adresse"}
                        </option>
                        <option key={opt.field} value={opt.field}>
                          {opt.label}
                        </option>
                      </Fragment>
                    );
                  }
                  return (
                    <option key={opt.field} value={opt.field}>
                      {opt.label}
                    </option>
                  );
                })}
                {otherCustomVariables.map((v) => (
                  <option key={`custom_${v.key}`} value={`custom_${v.key}`}>
                    {v.name} ({v.type})
                  </option>
                ))}
              </select>

              {/* Specific Project Type Target selector when sorting by projectType */}
              {sortField === "projectType" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: 700 }}>
                    Type:
                  </span>
                  <select
                    value={sortProjectType}
                    onChange={(e) => setSortProjectType(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "7px",
                      border: "1.5px solid #0284c7",
                      background: sortProjectType !== "all" ? "#e0f2fe" : "#f8fafc",
                      color: sortProjectType !== "all" ? "#0369a1" : "#0f172a",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: sortProjectType !== "all" ? "0 1px 3px rgba(2,132,199,0.2)" : "none",
                    }}
                    title="Choose which project type to sort / prioritize"
                  >
                    <option value="all">All Types (Alphabetical)</option>
                    {availableProjectTypes.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Board Status Target selector when sorting by status */}
              {sortField === "status" && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "12.5px", color: "#475569", fontWeight: 700 }}>
                    Status:
                  </span>
                  <select
                    value={sortBoardStatus}
                    onChange={(e) => setSortBoardStatus(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "7px",
                      border: "1.5px solid #0284c7",
                      background: sortBoardStatus !== "all" ? "#e0f2fe" : "#f8fafc",
                      color: sortBoardStatus !== "all" ? "#0369a1" : "#0f172a",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none",
                      boxShadow: sortBoardStatus !== "all" ? "0 1px 3px rgba(2,132,199,0.2)" : "none",
                    }}
                    title="Choose which board status to sort / prioritize"
                  >
                    <option value="all">All Statuses (Alphabetical)</option>
                    {availableBoardStatuses.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort direction toggle button */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1.5px solid #0284c7",
                  background: "#f0f9ff",
                  color: "#0369a1",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
                title={`Current order: ${sortOrder === "asc" ? "Ascending" : "Descending"}. Click to toggle.`}
              >
                {sortOrder === "asc" ? (
                  <>
                    <FaSortUp style={{ color: "#0284c7" }} />
                    <span>Ascending (A-Z, 1-9)</span>
                  </>
                ) : (
                  <>
                    <FaSortDown style={{ color: "#0284c7" }} />
                    <span>Descending (Z-A, 9-1)</span>
                  </>
                )}
              </button>

              {/* Reset sort button if non-default */}
              {(sortField !== "date" || sortOrder !== "desc" || sortProjectType !== "all" || sortBoardStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSortField("date");
                    setSortOrder("desc");
                    setSortProjectType("all");
                    setSortBoardStatus("all");
                  }}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    background: "#ffffff",
                    color: "#64748b",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  title="Reset to default sort (Target Date descending)"
                >
                  <FaTimes style={{ fontSize: "10px" }} />
                  <span>Reset sort</span>
                </button>
              )}
            </div>

            {/* RIGHT: VIEW LAYOUT SWITCHER */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginRight: "4px" }}>
                Layout:
              </span>
              <button
                type="button"
                onClick={() => setViewLayout("grouped")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1px solid",
                  borderColor: viewLayout === "grouped" ? "#0284c7" : "#cbd5e1",
                  background: viewLayout === "grouped" ? "#0284c7" : "#ffffff",
                  color: viewLayout === "grouped" ? "#ffffff" : "#475569",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: viewLayout === "grouped" ? "0 2px 5px rgba(2,132,199,0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
                title="Display projects grouped by workflow stage"
              >
                <span>📊 By Status</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewLayout("flat");
                  setFlatPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: "7px",
                  border: "1px solid",
                  borderColor: viewLayout === "flat" ? "#0284c7" : "#cbd5e1",
                  background: viewLayout === "flat" ? "#0284c7" : "#ffffff",
                  color: viewLayout === "flat" ? "#ffffff" : "#475569",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: viewLayout === "flat" ? "0 2px 5px rgba(2,132,199,0.25)" : "none",
                  transition: "all 0.15s ease",
                }}
                title="Display all projects in a single sortable global table"
              >
                <span>📋 Global Table</span>
                <span
                  style={{
                    background: viewLayout === "flat" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    color: viewLayout === "flat" ? "#ffffff" : "#0284c7",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  {sortedProjects.length}
                </span>
              </button>
            </div>
          </div>

          {/* TABLES FILTER TABS */}
          <div id="tables-section" style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => setFilterGroup("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: filterGroup === "all" ? "#0f172a" : "#e2e8f0",
                background: filterGroup === "all" ? "#0f172a" : "#fff",
                color: filterGroup === "all" ? "#fff" : "#475569",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: filterGroup === "all" ? "0 2px 6px rgba(15,23,42,0.15)" : "none",
              }}
            >
              <span>All boards</span>
              <span
                style={{
                  background: filterGroup === "all" ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  fontSize: "11px",
                }}
              >
                {sortedProjects.length}
              </span>
            </button>

            {GROUPS.map((grp) => {
              const count = sortedProjects.filter((p) => normalizeStatus(p.status) === grp.key).length;
              const isSelected = filterGroup === grp.key;
              return (
                <button
                  key={grp.key}
                  onClick={() => setFilterGroup(grp.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: `1px solid ${isSelected ? grp.color : "#e2e8f0"}`,
                    background: isSelected ? grp.color : "#fff",
                    color: isSelected ? "#fff" : "#475569",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: isSelected ? `0 2px 6px ${grp.color}40` : "none",
                  }}
                >
                  <span>{grp.icon} {grp.title}</span>
                  <span
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.25)" : grp.lightBg,
                      color: isSelected ? "#fff" : grp.color,
                      padding: "2px 7px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {searchTerm && (
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "6px" }}>
                Results for “<strong>{searchTerm}</strong>” ({sortedProjects.length})
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={styles.empty}>
              <p style={styles.emptyText}>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>📭</p>
              <p style={styles.emptyText}>No projects yet</p>
            </div>
          ) : sortedProjects.length === 0 && searchTerm ? (
            <div style={styles.empty}>
              <p style={styles.emptyIcon}>🔍</p>
              <p style={styles.emptyText}>
                No projects match your search “<strong>{searchTerm}</strong>”
              </p>
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  background: "#ff6e00",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  marginTop: "6px",
                }}
              >
                Reset search
              </button>
            </div>
          ) : (
            <div>
              {viewLayout === "flat" ? (
                /* UNIFIED GLOBAL FLAT TABLE */
                <div
                  style={{
                    marginBottom: "24px",
                    background: "#ffffff",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* FLAT TABLE HEADER */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 20px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "18px" }}>📋</span>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
                        Global Projects Table
                      </span>
                      <span
                        style={{
                          background: "#0284c7",
                          color: "#fff",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {flatTotalCount} projects
                      </span>
                      {filterGroup !== "all" && (
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#475569",
                            background: "#e2e8f0",
                            padding: "3px 9px",
                            borderRadius: "6px",
                            fontWeight: 600,
                          }}
                        >
                          Filtered by: <strong>{filterGroup === "awaiting_on_hold" ? "Awaiting / On Hold" : getStatusLabel(filterGroup)}</strong>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setFormData({
                          ...initialFormData,
                          status: filterGroup !== "all" ? filterGroup : "Project initiation & Discovery",
                          date: getFutureDateString(7),
                          submittedDate: "",
                        });
                        setEditingId(null);
                        setShowForm(true);
                      }}
                      style={{
                        background: "#ff6e00",
                        color: "#fff",
                        border: "none",
                        padding: "7px 14px",
                        borderRadius: "7px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 5px rgba(255,110,0,0.25)",
                      }}
                      title="Add a new project"
                    >
                      <FaPlus style={{ fontSize: "11px" }} /> Add Project
                    </button>
                  </div>

                  {/* TABLE CONTENT */}
                  {flatTotalCount === 0 ? (
                    <div
                      style={{
                        padding: "36px 20px",
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: "14px",
                        background: "#ffffff",
                      }}
                    >
                      <p style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: 600, color: "#64748b" }}>
                        No projects match the selected criteria.
                      </p>
                      <button
                        onClick={() => {
                          setFilterGroup("all");
                          setSearchTerm("");
                        }}
                        style={{
                          background: "#0284c7",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "7px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Show all projects
                      </button>
                    </div>
                  ) : (
                    <div className="admin-table-wrapper" style={styles.tableWrapper}>
                      <table style={styles.table}>
                        {renderTableThead()}
                        <tbody>
                          {flatPaginatedProjects.map((project) => renderProjectRow(project))}
                        </tbody>
                      </table>

                      {/* FLAT PAGINATION BAR */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 20px",
                          background: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {/* LEFT INFO */}
                        <div style={{ fontSize: "13px", color: "#475569", fontWeight: 600 }}>
                          Showing {flatStartItem} to {flatEndItem} of {flatTotalCount} projects (Page {safeFlatPage} of {flatTotalPages})
                        </div>

                        {/* RIGHT NAVIGATION */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {safeFlatPage > 1 && (
                            <button
                              onClick={() => setFlatPage(safeFlatPage - 1)}
                              style={{
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#0284c7",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              &lt; Previous
                            </button>
                          )}

                          {Array.from({ length: flatTotalPages }, (_, idx) => idx + 1)
                            .filter((p) => Math.abs(p - safeFlatPage) <= 3 || p === 1 || p === flatTotalPages)
                            .map((pageNum, idx, arr) => {
                              const prevNum = arr[idx - 1];
                              const showEllipsis = prevNum && pageNum - prevNum > 1;
                              return (
                                <span key={pageNum} style={{ display: "inline-flex", alignItems: "center" }}>
                                  {showEllipsis && <span style={{ padding: "0 4px", color: "#94a3b8" }}>...</span>}
                                  <button
                                    onClick={() => setFlatPage(pageNum)}
                                    style={{
                                      minWidth: "32px",
                                      height: "32px",
                                      padding: "0 8px",
                                      borderRadius: "6px",
                                      border: "1px solid",
                                      borderColor: pageNum === safeFlatPage ? "#0284c7" : "#e2e8f0",
                                      background: pageNum === safeFlatPage ? "#0284c7" : "#ffffff",
                                      color: pageNum === safeFlatPage ? "#ffffff" : "#475569",
                                      fontSize: "12.5px",
                                      fontWeight: pageNum === safeFlatPage ? 800 : 500,
                                      cursor: "pointer",
                                    }}
                                  >
                                    {pageNum}
                                  </button>
                                </span>
                              );
                            })}

                          {safeFlatPage < flatTotalPages && (
                            <button
                              onClick={() => setFlatPage(safeFlatPage + 1)}
                              style={{
                                padding: "5px 12px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                background: "#ffffff",
                                color: "#0284c7",
                                fontSize: "12.5px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Next &gt;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                GROUPS.filter((grp) => {
                  if (filterGroup === "all") return true;
                  if (filterGroup === "awaiting_on_hold") {
                    return ["Awaiting Client Response", "on Hold/Stuck"].includes(grp.key);
                  }
                  return filterGroup === grp.key;
                }).map((grp) => {
                const groupProjects = sortedProjects.filter((p) => normalizeStatus(p.status) === grp.key);
                const isCollapsed = !!collapsedGroups[grp.key];
                const totalCount = groupProjects.length;
                const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;
                const currentPage = getGroupPage(grp.key);
                const safePage = Math.min(Math.max(1, currentPage), totalPages);
                const paginatedProjects = totalCount > ITEMS_PER_PAGE
                  ? groupProjects.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)
                  : groupProjects;

                const startItem = totalCount === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
                const endItem = Math.min(safePage * ITEMS_PER_PAGE, totalCount);

                return (
                  <div
                    key={grp.key}
                    id={`group-table-${grp.key.replace(/\s+/g, "-")}`}
                    style={{
                      marginBottom: "24px",
                      background: "#ffffff",
                      borderRadius: "8px",
                      border: `1px solid ${grp.borderColor}`,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* GROUP TABLE HEADER */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 18px",
                        background: grp.headerBg,
                        borderBottom: isCollapsed ? "none" : `1px solid ${grp.borderColor}`,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                      onClick={() => toggleGroupCollapse(grp.key)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{grp.icon}</span>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: grp.color }}>
                          {grp.title}
                        </span>
                        <span
                          style={{
                            background: grp.color,
                            color: "#fff",
                            padding: "2px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {groupProjects.length}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({
                              ...initialFormData,
                              status: grp.key,
                              date: getFutureDateString(7),
                              submittedDate: "",
                            });
                            setEditingId(null);
                            setShowForm(true);
                          }}
                          style={{
                            background: "#fff",
                            color: grp.color,
                            border: `1px solid ${grp.borderColor}`,
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                          title={`Add a project with status ${getStatusLabel(grp.key)}`}
                        >
                          <FaPlus style={{ fontSize: "10px" }} /> New
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                        </button>
                      </div>
                    </div>

                    {/* GROUP TABLE */}
                    {!isCollapsed && (
                      <div>
                        {groupProjects.length === 0 ? (
                          <div
                            style={{
                              padding: "22px",
                              textAlign: "center",
                              color: "#94a3b8",
                              fontSize: "13px",
                              background: "#fafafa",
                            }}
                          >
                            <p style={{ margin: "0 0 10px 0" }}>{grp.emptyText}</p>
                            <button
                              onClick={() => {
                                setFormData({
                                  ...initialFormData,
                                  status: grp.key,
                                  date: getFutureDateString(7),
                                  submittedDate: "",
                                });
                                setEditingId(null);
                                setShowForm(true);
                              }}
                              style={{
                                background: grp.lightBg,
                                color: grp.color,
                                border: `1px dashed ${grp.borderColor}`,
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              + Add project in "{grp.title}"
                            </button>
                          </div>
                        ) : (
                          <div className="admin-table-wrapper" style={styles.tableWrapper}>
                            <table style={styles.table}>
                              {renderTableThead()}
                              <tbody>
                                {paginatedProjects.map((project) => renderProjectRow(project))}
                              </tbody>
                            </table>

                            {/* PAGINATION BAR */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 18px",
                                background: "#f8fafc",
                                borderTop: "1px solid #e2e8f0",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              {/* LEFT INFO */}
                              <div style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                                {totalCount === 0 ? "0 of 0" : `${startItem}-${endItem} of ${totalCount}`}
                              </div>

                              {/* RIGHT NAVIGATION */}
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                {safePage > 1 && (
                                  <button
                                    onClick={() => setGroupPage(grp.key, safePage - 1)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#0ea5e9",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    &lt; PREV
                                  </button>
                                )}

                                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                                  <button
                                    key={pageNum}
                                    onClick={() => setGroupPage(grp.key, pageNum)}
                                    style={{
                                      background: pageNum === safePage ? "#e0f2fe" : "transparent",
                                      border: "none",
                                      color: pageNum === safePage ? "#0369a1" : "#475569",
                                      fontSize: "13px",
                                      fontWeight: pageNum === safePage ? 800 : 500,
                                      cursor: "pointer",
                                      padding: "4px 8px",
                                      borderRadius: "4px",
                                      minWidth: "24px",
                                    }}
                                  >
                                    {pageNum}
                                  </button>
                                ))}

                                {safePage < totalPages && (
                                  <button
                                    onClick={() => setGroupPage(grp.key, safePage + 1)}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "#0ea5e9",
                                      fontSize: "13px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    NEXT &gt;
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            </div>
          )}
        </div>

        {/* SIDE DETAILS PANEL & MOBILE BACKDROP */}
        {showDetails && selectedProject && (
          <>
            <div className="admin-drawer-backdrop" onClick={() => setShowDetails(false)} />
            <div className="admin-side-panel">
              <div style={styles.sidePanelTopBar}>
                <button style={styles.kebabBtn}>•••</button>
                <button style={styles.closeBtn} onClick={() => setShowDetails(false)}>✕</button>
              </div>

            <h3 style={styles.panelTitle}>{selectedProject.name}</h3>
            <p style={styles.breadcrumb}>
              in → <span style={styles.breadcrumbLink}>Project Initiation & Discovery</span> Board
            </p>

            {/* INFOS */}
            <div style={styles.infoSection}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#fdab3d" }}>●</span>
                  Status
                </span>
                <select
                  value={normalizeStatus(selectedProject.status)}
                  onChange={(e) => handleUpdateStatus(selectedProject, e.target.value)}
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(selectedProject.status, workflowStatuses),
                    border: "none",
                    cursor: "pointer",
                    outline: "none",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontWeight: 700,
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  title="Change status"
                >
                  {GROUPS.map((g) => (
                    <option
                      key={g.key}
                      value={g.key}
                      style={{ background: "#fff", color: g.color, fontWeight: 600 }}
                    >
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* ADRESSE (PLACED DIRECTLY BEFORE PRIORITY) */}
              {adresseVariable && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>
                    <span style={{ ...styles.iconSquare, background: "#0284c7" }}>📍</span>
                    {adresseVariable.name}
                  </span>
                  <input
                    type="text"
                    placeholder="Enter address..."
                    defaultValue={selectedProject.customFields?.[adresseVariable.key] ?? selectedProject.customFields?.["adresse"] ?? ""}
                    key={`drawer-${selectedProject.id}-${adresseVariable.key}-${selectedProject.customFields?.[adresseVariable.key] ?? ""}`}
                    onBlur={(e) => {
                      const currentVal = selectedProject.customFields?.[adresseVariable.key] ?? "";
                      if (e.target.value !== currentVal) {
                        handleUpdateCustomField(selectedProject, adresseVariable.key, e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      maxWidth: "240px",
                      width: "100%",
                      outline: "none",
                    }}
                  />
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#f97316" }}>🚩</span>
                  Priority
                </span>
                <select
                  value={selectedProject.priority || "Medium"}
                  onChange={(e) => handleUpdateField(selectedProject, "priority", e.target.value)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    ...getPriorityStyle(selectedProject.priority || "Medium"),
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#6366f1" }}>⚡</span>
                  {getLabel("projectType", "Project Type")}
                </span>
                <div style={{ flex: 1, maxWidth: "260px" }}>
                  <ProjectTypeMultiSelect
                    value={selectedProject.projectType}
                    onChange={(newTypes) => handleUpdateField(selectedProject, "projectType", newTypes)}
                  />
                </div>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#ffcb00", color: "#7a5b00" }}>T</span>
                  Contractor
                </span>
                <select
                  value={selectedProject.contractor?._id || ""}
                  onChange={(e) => handleUpdateContractor(selectedProject, e.target.value)}
                  style={styles.infoInput}
                >
                  <option value="">No contractor</option>
                  {contractorsList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject.submittedDate && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>
                    <span style={{ ...styles.iconSquare, background: "#0284c7" }}>📨</span>
                    Submitted Date
                  </span>
                  <span style={styles.infoValue}>{selectedProject.submittedDate}</span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#a25ddc" }}>📅</span>
                  Target Date
                </span>
                <span style={styles.infoValue}>{selectedProject.date}</span>
              </div>

              {/* SEPARATE VARIABLE 1: TIME SPENT (TODAY - SUBMITTED DATE) */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#0284c7" }}>⏱️</span>
                  Time Spent (Temps passé)
                </span>
                <span style={{
                  ...styles.infoValue,
                  fontWeight: 700,
                  color: getProjectTimelineHighlight(selectedProject, workflowStatuses).state === "red"
                    ? "#dc2626"
                    : getProjectTimelineHighlight(selectedProject, workflowStatuses).state === "yellow"
                    ? "#d97706"
                    : "#0369a1",
                }}>
                  {getProjectTimelineHighlight(selectedProject, workflowStatuses).timeSpentLabel}
                </span>
              </div>

              {/* SEPARATE VARIABLE 2: TARGET DURATION (TARGET DATE - SUBMITTED DATE) */}
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#6366f1" }}>⏳</span>
                  Target Duration (Durée prévue)
                </span>
                <span style={{ ...styles.infoValue, fontWeight: 600, color: "#475569" }}>
                  {getProjectTimelineHighlight(selectedProject, workflowStatuses).plannedDurationLabel}
                </span>
              </div>

              {/* TEAM DETAILS */}
              <div style={{ margin: "14px 0 8px 0", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>
                  Team & Contacts
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>PM Name</span>
                <span style={styles.infoValue}>{selectedProject.pmName || "—"}</span>
              </div>
              {selectedProject.pmEmails && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>PM Email</span>
                  <span style={{ ...styles.infoValue, fontSize: "12px", color: "#0284c7" }}>{selectedProject.pmEmails}</span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Drafter</span>
                <span style={styles.infoValue}>{selectedProject.drafterName || "—"}</span>
              </div>
              {selectedProject.drafterEmails && (
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Drafter Email</span>
                  <span style={{ ...styles.infoValue, fontSize: "12px", color: "#0284c7" }}>{selectedProject.drafterEmails}</span>
                </div>
              )}

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Struct Engi</span>
                <select
                  value={selectedProject.structEngi || "Choose"}
                  onChange={(e) => handleUpdateField(selectedProject, "structEngi", e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "7px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    outline: "none",
                    border: "1.5px solid",
                    ...getStructEngiBadgeStyle(selectedProject.structEngi || "Choose"),
                  }}
                  title="Update Struct Engi status"
                >
                  {Array.from(new Set([selectedProject.structEngi || "Choose", ...STRUCT_ENGI_OPTIONS]))
                    .filter(Boolean)
                    .map((opt) => (
                      <option key={opt} value={opt} style={{ background: "#ffffff", color: "#0f172a", fontWeight: 500 }}>
                        {opt}
                      </option>
                    ))}
                </select>
              </div>

              {/* OTHER CUSTOM DYNAMIC VARIABLES IN DRAWER */}
              {otherCustomVariables.length > 0 && (
                <>
                  <div style={{ margin: "14px 0 8px 0", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>
                      Custom Variables
                    </span>
                  </div>
                  {otherCustomVariables.map((v) => {
                    const val = selectedProject.customFields?.[v.key] ?? "";
                    return (
                      <div key={v._id} style={styles.infoRow}>
                        <span style={styles.infoLabel}>{v.name}</span>
                        {v.type === "number" ? (
                          <input
                            type="number"
                            defaultValue={val}
                            key={`drawer-${selectedProject.id}-${v.key}-${val}`}
                            onBlur={(e) => {
                              const numVal = e.target.value === "" ? "" : Number(e.target.value);
                              if (numVal !== val) {
                                handleUpdateCustomField(selectedProject, v.key, numVal);
                              }
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              maxWidth: "160px",
                              outline: "none",
                            }}
                          />
                        ) : v.type === "date" ? (
                          <input
                            type="date"
                            defaultValue={val ? String(val).slice(0, 10) : ""}
                            key={`drawer-${selectedProject.id}-${v.key}-${val}`}
                            onChange={(e) => {
                              handleUpdateCustomField(selectedProject, v.key, e.target.value);
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              maxWidth: "160px",
                              outline: "none",
                            }}
                          />
                        ) : (
                          <input
                            type="text"
                            defaultValue={val}
                            key={`drawer-${selectedProject.id}-${v.key}-${val}`}
                            onBlur={(e) => {
                              if (e.target.value !== val) {
                                handleUpdateCustomField(selectedProject, v.key, e.target.value);
                              }
                            }}
                            style={{
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              maxWidth: "160px",
                              outline: "none",
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* WORKFLOW STATUSES */}
              <div style={{ margin: "14px 0 8px 0", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>
                  Workflow & Reviews
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>PM Status</span>
                <span style={{ ...styles.infoValue, fontWeight: 600 }}>{selectedProject.pmStatus || "—"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Drafting Status</span>
                <span style={{ ...styles.infoValue, fontWeight: 600 }}>{selectedProject.draftingStatus || "—"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>QA & Delivery</span>
                <span style={{ ...styles.infoValue, fontWeight: 600, color: selectedProject.qaAndDeliveryStatus === "QA Passed" ? "#059669" : "#334155" }}>
                  {selectedProject.qaAndDeliveryStatus || "—"}
                </span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>I&D Review</span>
                <span style={styles.infoValue}>{selectedProject.idReview || "—"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Peer Review</span>
                <span style={styles.infoValue}>{selectedProject.peerReview || "—"}</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>RFI Status</span>
                <span style={{ ...styles.infoValue, fontWeight: 600, color: selectedProject.rfiStatus === "Resolved" ? "#059669" : "#d97706" }}>
                  {selectedProject.rfiStatus || "—"}
                </span>
              </div>

              {/* ENGINEERING & UPDATES */}
              {(selectedProject.seTime || selectedProject.projectSs || selectedProject.updates) && (
                <>
                  <div style={{ margin: "14px 0 8px 0", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.5px" }}>
                      Engineering & Updates
                    </span>
                  </div>

                  {selectedProject.seTime && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>SE Time</span>
                      <span style={styles.infoValue}>{selectedProject.seTime}</span>
                    </div>
                  )}

                  {selectedProject.projectSs && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Project SS</span>
                      <span style={styles.infoValue}>{selectedProject.projectSs}</span>
                    </div>
                  )}

                  {selectedProject.updates && (
                    <div style={{ ...styles.infoRow, flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                      <span style={styles.infoLabel}>Latest Updates</span>
                      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 10px", width: "100%", boxSizing: "border-box", fontSize: "12px", color: "#334155", whiteSpace: "pre-wrap" }}>
                        {selectedProject.updates}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div style={{ ...styles.infoRow, flexDirection: "column", alignItems: "flex-start", gap: "4px", marginTop: "10px" }}>
                <span style={styles.infoLabel}>
                  <span style={{ ...styles.iconSquare, background: "#00c875" }}>☰</span>
                  Notes / Description
                </span>
                <span style={{ ...styles.infoValue, width: "100%", whiteSpace: "pre-wrap", color: "#475569", fontSize: "12.5px" }}>
                  {selectedProject.description || <em style={{ color: "#94a3b8" }}>No description provided</em>}
                </span>
              </div>
            </div>

            {/* TABS */}
            <div style={styles.tabs}>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "comments" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("comments")}
              >
                <FaComment /> Comments ({selectedProject.comments.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "links" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("links")}
              >
                <FaLink /> Links ({selectedProject.links.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "files" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("files")}
              >
                <FaFile /> Files ({selectedProject.files.length})
              </button>
              <button
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === "images" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("images")}
              >
                <FaImage /> Images ({selectedProject.images.length})
              </button>
            </div>

            {/* COMMENTS */}
            {activeTab === "comments" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <MentionInput
                    placeholder="Add a comment... (Type @ to mention someone)"
                    value={newComment}
                    onChange={setNewComment}
                    users={mentionableUsers}
                    rows={3}
                    inputStyle={styles.commentInput}
                  />
                  <button
                    style={styles.addItemBtn}
                    onClick={() => handleAddComment(selectedProjectId!)}
                  >
                    Add Comment
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {selectedProject.comments.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No comments yet.
                    </p>
                  ) : (
                    selectedProject.comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          padding: "14px",
                          marginBottom: "12px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div style={styles.commentHeader}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: "#fdab3d",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                fontWeight: 700,
                              }}
                            >
                              {comment.author.charAt(0).toUpperCase()}
                            </div>
                            <strong style={styles.commentAuthor}>{comment.author}</strong>
                          </div>
                          <span style={styles.commentDate}>{comment.date}</span>
                        </div>

                        {editingCommentId === comment.id ? (
                          <div style={{ margin: "10px 0" }}>
                            <MentionInput
                              value={editingCommentText}
                              onChange={setEditingCommentText}
                              users={mentionableUsers}
                              rows={3}
                              autoFocus
                              inputStyle={{
                                width: "100%",
                                padding: "8px 10px",
                                border: "1px solid #fdba74",
                                borderRadius: "6px",
                                fontSize: "13.5px",
                                outline: "none",
                                background: "#fff",
                                boxSizing: "border-box",
                                fontFamily: "inherit",
                              }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "8px" }}>
                              <button
                                onClick={handleCancelEditComment}
                                style={{
                                  background: "#f1f5f9",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveComment(selectedProjectId!, comment.id)}
                                style={{
                                  background: "#ea580c",
                                  color: "#fff",
                                  border: "none",
                                  padding: "4px 12px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaCheckCircle style={{ fontSize: "11px" }} /> Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="editable-comment-body"
                            onClick={() => handleStartEditComment(comment)}
                            title="Click to edit comment"
                            style={{ margin: "6px 0 10px 0" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                              <p style={{ ...styles.commentText, margin: 0, color: "#1e293b", fontSize: "13.5px", lineHeight: 1.5, flex: 1 }}>
                                {renderCommentTextWithMentions(comment.text)}
                                {comment.isEdited && (
                                  <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px", fontStyle: "italic" }}>
                                    (edited)
                                  </span>
                                )}
                              </p>
                              <span
                                className="comment-edit-hint"
                                style={{
                                  fontSize: "11px",
                                  color: "#ea580c",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  background: "#fff7ed",
                                  border: "1px solid #fed7aa",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  flexShrink: 0,
                                }}
                              >
                                <FaPencilAlt style={{ fontSize: "9px" }} /> Click to edit
                              </span>
                            </div>
                          </div>
                        )}

                        {/* COMMENT ACTIONS BAR */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                              onClick={() => {
                                if (replyingToCommentId === comment.id) {
                                  setReplyingToCommentId(null);
                                  setReplyText("");
                                } else {
                                  setReplyingToCommentId(comment.id);
                                  setReplyText("");
                                }
                              }}
                              style={{
                                background: replyingToCommentId === comment.id ? "#ffedd5" : "#f8fafc",
                                color: "#ea580c",
                                border: "1px solid #fed7aa",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <FaReply /> {replyingToCommentId === comment.id ? "Close reply" : "Reply"}
                            </button>

                            <button
                              onClick={() => handleStartEditComment(comment)}
                              style={{
                                background: editingCommentId === comment.id ? "#ffedd5" : "#f8fafc",
                                color: "#475569",
                                border: "1px solid #e2e8f0",
                                padding: "4px 10px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                              title="Edit comment"
                            >
                              <FaPencilAlt style={{ fontSize: "10px" }} /> Edit
                            </button>
                          </div>

                          <button
                            style={{
                              ...styles.deleteItemBtn,
                              padding: "4px 8px",
                              fontSize: "11.5px",
                            }}
                            onClick={() => handleDeleteComment(selectedProjectId!, comment.id)}
                            title="Delete this comment"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>

                        {/* INLINE REPLY INPUT */}
                        {replyingToCommentId === comment.id && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px",
                              background: "#fff7ed",
                              borderRadius: "8px",
                              border: "1px solid #fed7aa",
                            }}
                          >
                            <MentionInput
                              isSingleLine
                              placeholder={`Reply to ${comment.author}... (Type @ to mention)`}
                              value={replyText}
                              onChange={setReplyText}
                              users={mentionableUsers}
                              onEnterSubmit={() => handleAddReply(selectedProjectId!, comment.id)}
                              autoFocus
                              inputStyle={{
                                width: "100%",
                                padding: "8px 10px",
                                border: "1px solid #fdba74",
                                borderRadius: "6px",
                                fontSize: "12.5px",
                                outline: "none",
                                background: "#fff",
                                boxSizing: "border-box",
                                marginBottom: "6px",
                              }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                onClick={() => {
                                  setReplyingToCommentId(null);
                                  setReplyText("");
                                }}
                                style={{
                                  background: "#e2e8f0",
                                  color: "#475569",
                                  border: "none",
                                  padding: "4px 10px",
                                  borderRadius: "4px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddReply(selectedProjectId!, comment.id)}
                                style={{
                                  background: "#ea580c",
                                  color: "#fff",
                                  border: "none",
                                  padding: "4px 12px",
                                  borderRadius: "4px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaPaperPlane style={{ fontSize: "10px" }} /> Send
                              </button>
                            </div>
                          </div>
                        )}

                        {/* NESTED REPLIES */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingLeft: "12px",
                              borderLeft: "2px solid #fdba74",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                            }}
                          >
                            {comment.replies.map((reply) => (
                              <div
                                key={reply.id}
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #f1f5f9",
                                  borderRadius: "8px",
                                  padding: "8px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ color: "#ea580c", fontSize: "11px", fontWeight: 700 }}>↳</span>
                                    <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                                      {reply.author}
                                    </strong>
                                    {reply.isEdited && (
                                      <span style={{ fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>
                                        (edited)
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{reply.date}</span>
                                    <button
                                      onClick={() => handleStartEditReply(reply)}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#64748b",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        padding: "2px",
                                      }}
                                      title="Edit this reply"
                                    >
                                      <FaPencilAlt />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteReply(selectedProjectId!, comment.id, reply.id)
                                      }
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        padding: "2px",
                                      }}
                                      title="Delete this reply"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>

                                {editingReplyId === reply.id ? (
                                  <div style={{ marginTop: "6px" }}>
                                    <MentionInput
                                      isSingleLine
                                      value={editingReplyText}
                                      onChange={setEditingReplyText}
                                      users={mentionableUsers}
                                      onEnterSubmit={() =>
                                        handleSaveReply(selectedProjectId!, comment.id, reply.id)
                                      }
                                      autoFocus
                                      inputStyle={{
                                        width: "100%",
                                        padding: "6px 8px",
                                        border: "1px solid #fdba74",
                                        borderRadius: "6px",
                                        fontSize: "12.5px",
                                        outline: "none",
                                        background: "#fff",
                                        boxSizing: "border-box",
                                        marginBottom: "6px",
                                      }}
                                    />
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                      <button
                                        onClick={handleCancelEditReply}
                                        style={{
                                          background: "#e2e8f0",
                                          color: "#475569",
                                          border: "none",
                                          padding: "3px 8px",
                                          borderRadius: "4px",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleSaveReply(selectedProjectId!, comment.id, reply.id)
                                        }
                                        style={{
                                          background: "#ea580c",
                                          color: "#fff",
                                          border: "none",
                                          padding: "3px 10px",
                                          borderRadius: "4px",
                                          fontSize: "11px",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                        }}
                                      >
                                        <FaCheckCircle style={{ fontSize: "10px" }} /> Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="editable-comment-body"
                                    onClick={() => handleStartEditReply(reply)}
                                    title="Click to edit reply"
                                    style={{ marginTop: "2px" }}
                                  >
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                                      <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: 1.4, flex: 1 }}>
                                        {renderCommentTextWithMentions(reply.text)}
                                      </p>
                                      <span
                                        className="comment-edit-hint"
                                        style={{
                                          fontSize: "10px",
                                          color: "#ea580c",
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "2px",
                                          background: "#fff7ed",
                                          border: "1px solid #fed7aa",
                                          padding: "1px 4px",
                                          borderRadius: "3px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <FaPencilAlt style={{ fontSize: "8px" }} /> Edit
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* LINKS */}
            {activeTab === "links" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <input
                    type="text"
                    placeholder="Link title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    style={styles.input}
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    style={styles.input}
                  />
                  <button
                    style={styles.addItemBtn}
                    onClick={() => handleAddLink(selectedProjectId!)}
                  >
                    Add Link
                  </button>
                </div>

                <div style={styles.itemsList}>
                  {selectedProject.links.map((link) => (
                    <div key={link.id} style={styles.linkItem}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" style={styles.linkUrl}>
                        🔗 {link.title}
                      </a>
                      <button
                        style={styles.deleteItemBtn}
                        onClick={() => handleDeleteLink(selectedProjectId!, link.id)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILES */}
            {activeTab === "files" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFileObj(e.target.files[0]);
                          if (!newFile.name) {
                            setNewFile({ ...newFile, name: e.target.files[0].name });
                          }
                        }
                      }}
                      style={{
                        ...styles.input,
                        padding: "8px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Custom name (optional)"
                      value={newFile.name}
                      onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                      style={styles.input}
                    />
                    <button
                      style={{
                        ...styles.addItemBtn,
                        opacity: isUploading ? 0.7 : 1,
                        cursor: isUploading ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleAddFile(selectedProjectId!)}
                      disabled={isUploading}
                    >
                      <FaUpload style={{ marginRight: "6px" }} />
                      {isUploading ? "Uploading..." : "Upload File"}
                    </button>
                  </div>
                </div>

                {selectedProject.files.length > 0 && (
                  <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      style={{
                        background: "#8b5cf6",
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      onClick={() => handleExportProjectFilesZip(selectedProject.id, selectedProject.name)}
                      title="Download all files and images of this project as ZIP archive"
                    >
                      <FaFileArchive /> Export project files (.ZIP)
                    </button>
                  </div>
                )}

                <div style={styles.itemsList}>
                  {selectedProject.files.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No files attached to this project.
                    </p>
                  ) : (
                    selectedProject.files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          ...styles.fileItem,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          marginBottom: "8px",
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden", flex: 1 }}>
                          <span style={{ fontSize: "18px" }}>📄</span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1e293b",
                              wordBreak: "break-all",
                            }}
                            title={file.name}
                          >
                            {file.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
                          <button
                            onClick={() => handleDownloadFile(selectedProjectId!, file.id, file.name)}
                            style={{
                              padding: "6px 10px",
                              background: "#0284c7",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Download / Export this file"
                          >
                            <FaDownload /> Export
                          </button>
                          <button
                            style={styles.deleteItemBtn}
                            onClick={() => handleDeleteFile(selectedProjectId!, file.id)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* IMAGES */}
            {activeTab === "images" && (
              <div style={styles.tabContent}>
                <div style={styles.inputSection}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedImageObj(e.target.files[0]);
                          if (!newImage.title) {
                            setNewImage({ ...newImage, title: e.target.files[0].name });
                          }
                        }
                      }}
                      style={{
                        ...styles.input,
                        padding: "8px",
                        cursor: "pointer",
                        background: "#fff",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Image title (optional)"
                      value={newImage.title}
                      onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                      style={styles.input}
                    />
                    <button
                      style={{
                        ...styles.addItemBtn,
                        opacity: isUploadingImage ? 0.7 : 1,
                        cursor: isUploadingImage ? "not-allowed" : "pointer",
                      }}
                      onClick={() => handleAddImage(selectedProjectId!)}
                      disabled={isUploadingImage}
                    >
                      <FaUpload style={{ marginRight: "6px" }} />
                      {isUploadingImage ? "Uploading..." : "Upload Image"}
                    </button>
                  </div>
                </div>

                <div style={styles.imagesGrid}>
                  {selectedProject.images.length === 0 ? (
                    <p style={{ color: "#888", fontSize: "14px", fontStyle: "italic", padding: "10px 0" }}>
                      No images attached to this project.
                    </p>
                  ) : (
                    selectedProject.images.map((image) => (
                      <div key={image.id} style={styles.imageCard}>
                        <a href={image.url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                          <img src={image.url} alt={image.title} style={styles.image} />
                        </a>
                        {image.title && <p style={styles.imageTitle}>{image.title}</p>}
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "8px" }}>
                          <button
                            onClick={() => handleDownloadImage(selectedProjectId!, image.id, image.title || "image.png")}
                            style={{
                              padding: "6px 10px",
                              background: "#0284c7",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            title="Download / Export this image"
                          >
                            <FaDownload /> Export
                          </button>
                          <button
                            style={styles.deleteImageBtn}
                            onClick={() => handleDeleteImage(selectedProjectId!, image.id)}
                            title="Delete"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          </>
        )}
      </div>
        </>
      )}
      {/* REAL CUSTOM DELETE CONFIRMATION POPUP MODAL */}
      {projectToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: "16px",
          }}
          onClick={() => {
            if (!isDeletingProject) setProjectToDelete(null);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "22px",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(226, 232, 240, 0.9)",
              maxWidth: "460px",
              width: "100%",
              overflow: "hidden",
              textAlign: "center",
              padding: "32px 28px 24px",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                if (!isDeletingProject) setProjectToDelete(null);
              }}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#64748b",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              title="Close"
            >
              ✕
            </button>

            {/* DANGER ICON BADGE */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                border: "2px solid #fca5a5",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                fontSize: "30px",
                boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.25)",
              }}
            >
              🗑️
            </div>

            {/* TITLE & MESSAGE */}
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: "20px",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.4px",
              }}
            >
              Delete Project?
            </h3>
            <p
              style={{
                margin: "0 0 18px 0",
                fontSize: "13.5px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Are you sure you really want to delete this project? This action is permanent and cannot be undone.
            </p>

            {/* HIGHLIGHTED PROJECT CARD */}
            <div
              style={{
                background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "12px 16px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  flexShrink: 0,
                  fontWeight: 800,
                }}
              >
                ⚠️
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Project Name
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={projectToDelete.name}
                >
                  {projectToDelete.name}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.3fr",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeletingProject}
                style={{
                  padding: "11px 18px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: isDeletingProject ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingProject}
                style={{
                  padding: "11px 18px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: isDeletingProject ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(220, 38, 38, 0.35)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                  opacity: isDeletingProject ? 0.7 : 1,
                }}
              >
                {isDeletingProject ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOW TIMERS & STAGES SETTINGS MODAL */}
      {showStatusSettingsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
          onClick={() => setShowStatusSettingsModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)",
              maxWidth: "880px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "22px",
                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                  }}
                >
                  ⏱️
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#0f172a",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Workflow Timers & Stages Settings
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#0284c7",
                        background: "#e0f2fe",
                        padding: "2px 9px",
                        borderRadius: "6px",
                        border: "1px solid #bae6fd",
                      }}
                    >
                      {activeService}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      • Configure deadline timers for warning & overdue highlights
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowStatusSettingsModal(false)}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#64748b",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              {/* VISUAL GUIDANCE CARDS */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
                    border: "1.5px solid #fde047",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 4px rgba(253, 224, 71, 0.15)",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#854d0e" }}>
                      Yellow Warning Phase
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#a16207", marginTop: "2px", lineHeight: 1.3 }}>
                      Exceeding this threshold turns the project title into a <strong>Yellow Highlight</strong> with warning tag.
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)",
                    border: "1.5px solid #fca5a5",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 4px rgba(252, 165, 165, 0.15)",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>🚨</span>
                  <div>
                    <div style={{ fontSize: "12.5px", fontWeight: 800, color: "#991b1b" }}>
                      Red Critical Overdue
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#b91c1c", marginTop: "2px", lineHeight: 1.3 }}>
                      Exceeding this longer timeline triggers the project title to change to <strong>Alert Red Highlight</strong>.
                    </div>
                  </div>
                </div>
              </div>

              {/* STAGES TABLE HEADER */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 130px 115px 115px 110px",
                  gap: "12px",
                  padding: "10px 16px",
                  background: "#f1f5f9",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  alignItems: "center",
                }}
              >
                <span>Stage Name</span>
                <span style={{ textAlign: "center" }}>Live Badge Preview</span>
                <span style={{ textAlign: "center" }}>Yellow (Hours)</span>
                <span style={{ textAlign: "center" }}>Red (Hours)</span>
                <span style={{ textAlign: "right" }}>Actions</span>
              </div>

              {/* STAGES ROWS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", marginBottom: "24px" }}>
                {workflowStatuses.map((st, idx) => {
                  const values = editingThresholds[st._id] || {
                    yellow: st.yellowThresholdHours ?? 24,
                    red: st.redThresholdHours ?? 48,
                  };
                  return (
                    <div
                      key={st._id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 130px 115px 115px 110px",
                        gap: "12px",
                        padding: "11px 16px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        alignItems: "center",
                      }}
                    >
                      {/* 1. NAME & ICON */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: st.lightBg || "#f1f5f9",
                            border: `1.5px solid ${st.borderColor || "#cbd5e1"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "17px",
                            flexShrink: 0,
                          }}
                        >
                          {st.icon || "📌"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "13.5px",
                              color: "#0f172a",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={st.name}
                          >
                            {st.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            Stage {idx + 1} of {workflowStatuses.length}
                          </div>
                        </div>
                      </div>

                      {/* 2. REAL LIVE BADGE */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "14px",
                            background: `linear-gradient(135deg, ${st.badgeColor || st.color || "#0284c7"}, ${st.color || "#0369a1"})`,
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 700,
                            boxShadow: "0 2px 5px rgba(0,0,0,0.12)",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                        >
                          <span>{st.icon || "📌"}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{st.name}</span>
                        </span>
                      </div>

                      {/* 3. YELLOW TIMER INPUT */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#fefce8",
                            border: "1.5px solid #fde047",
                            borderRadius: "8px",
                            padding: "0 8px",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                          }}
                        >
                          <span style={{ fontSize: "11px", marginRight: "3px" }}>⚠️</span>
                          <input
                            type="number"
                            min="1"
                            max="99999"
                            value={values.yellow}
                            onChange={(e) =>
                              setEditingThresholds({
                                ...editingThresholds,
                                [st._id]: { ...values, yellow: Number(e.target.value) },
                              })
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              padding: "6px 0",
                              fontSize: "13px",
                              fontWeight: 800,
                              color: "#854d0e",
                              outline: "none",
                              textAlign: "right",
                            }}
                            title="Hours in stage before Yellow warning highlight"
                          />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#ca8a04", marginLeft: "4px" }}>
                            h
                          </span>
                        </div>
                      </div>

                      {/* 4. RED TIMER INPUT */}
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: "#fff1f2",
                            border: "1.5px solid #fca5a5",
                            borderRadius: "8px",
                            padding: "0 8px",
                            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                          }}
                        >
                          <span style={{ fontSize: "11px", marginRight: "3px" }}>🚨</span>
                          <input
                            type="number"
                            min="1"
                            max="99999"
                            value={values.red}
                            onChange={(e) =>
                              setEditingThresholds({
                                ...editingThresholds,
                                [st._id]: { ...values, red: Number(e.target.value) },
                              })
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              padding: "6px 0",
                              fontSize: "13px",
                              fontWeight: 800,
                              color: "#991b1b",
                              outline: "none",
                              textAlign: "right",
                            }}
                            title="Hours in stage before Red overdue highlight"
                          />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#e11d48", marginLeft: "4px" }}>
                            h
                          </span>
                        </div>
                      </div>

                      {/* 5. ACTIONS */}
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => handleSaveThreshold(st._id)}
                          disabled={isSavingStatus}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                            color: "#ffffff",
                            fontSize: "11.5px",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(2, 132, 199, 0.2)",
                            transition: "all 0.15s ease",
                          }}
                          title="Save timer threshold changes for this stage"
                        >
                          Save
                        </button>
                        {workflowStatuses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkflowStatus(st._id, st.name)}
                            disabled={isSavingStatus}
                            style={{
                              padding: "6px 9px",
                              borderRadius: "8px",
                              border: "1px solid #fecaca",
                              background: "#fff1f2",
                              color: "#dc2626",
                              fontSize: "11px",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                            title="Delete this stage from workflow"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADD NEW CUSTOM STAGE FORM */}
              <div
                style={{
                  background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
                  borderRadius: "14px",
                  border: "1.5px dashed #cbd5e1",
                  padding: "16px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: "#ff6e00",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    +
                  </div>
                  <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 800, color: "#1e293b" }}>
                    Add New Custom Stage to <span style={{ color: "#ff6e00" }}>{activeService}</span>
                  </h4>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 70px 90px 100px 100px auto",
                    gap: "10px",
                    alignItems: "flex-end",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                      Stage Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Utility Review"
                      value={newStatusForm.name}
                      onChange={(e) => setNewStatusForm({ ...newStatusForm, name: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#0f172a",
                        background: "#ffffff",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                      Icon
                    </label>
                    <input
                      type="text"
                      value={newStatusForm.icon}
                      onChange={(e) => setNewStatusForm({ ...newStatusForm, icon: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 4px",
                        border: "1.5px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "15px",
                        textAlign: "center",
                        background: "#ffffff",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                      Color
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="color"
                        value={newStatusForm.color}
                        onChange={(e) => setNewStatusForm({ ...newStatusForm, color: e.target.value })}
                        style={{
                          width: "36px",
                          height: "36px",
                          padding: "2px",
                          borderRadius: "8px",
                          border: "1.5px solid #cbd5e1",
                          cursor: "pointer",
                          background: "#ffffff",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#854d0e", marginBottom: "4px" }}>
                      Yellow (h)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newStatusForm.yellowHours}
                      onChange={(e) => setNewStatusForm({ ...newStatusForm, yellowHours: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1.5px solid #fde047",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "#854d0e",
                        background: "#fefce8",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#991b1b", marginBottom: "4px" }}>
                      Red (h)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newStatusForm.redHours}
                      onChange={(e) => setNewStatusForm({ ...newStatusForm, redHours: Number(e.target.value) })}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        border: "1.5px solid #fca5a5",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: 700,
                        color: "#991b1b",
                        background: "#fef2f2",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleCreateNewStatus}
                      disabled={isSavingStatus}
                      style={{
                        padding: "9px 18px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #ff6e00 0%, #ea580c 100%)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 6px rgba(255, 110, 0, 0.3)",
                      }}
                    >
                      + Add Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: 600 }}>
                📊 Total: <strong>{workflowStatuses.length} stages</strong> configured for <strong>{activeService}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowStatusSettingsModal(false)}
                style={{
                  padding: "9px 24px",
                  borderRadius: "9px",
                  border: "none",
                  background: "#0f172a",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                Done & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusStyle(status: string, customStatuses: WorkflowStatus[] = []): React.CSSProperties {
  const norm = normalizeStatus(status);
  const found = customStatuses.find((s) => s.key === norm || s.name === norm);
  if (found) {
    const color = found.color || "#3b82f6";
    const badgeColor = found.badgeColor || color;
    return { background: `linear-gradient(135deg, ${badgeColor}, ${color})`, color: "#fff" };
  }
  switch (norm) {
    case "Change Requests":
      return { background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff" };
    case "Project initiation & Discovery":
      return { background: "linear-gradient(135deg, #0ea5e9, #0284c7)", color: "#fff" };
    case "Project Processing":
      return { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" };
    case "QA Delivery":
      return { background: "linear-gradient(135deg, #14b8a6, #0d9488)", color: "#fff" };
    case "Awaiting Client Response":
      return { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff" };
    case "on Hold/Stuck":
      return { background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" };
    case "Commercial":
      return { background: "linear-gradient(135deg, #ec4899, #db2777)", color: "#fff" };
    case "Automations":
      return { background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff" };
    case "Completed":
      return { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff" };
    default:
      return { background: "linear-gradient(135deg, #64748b, #475569)", color: "#fff" };
  }
}

const styles: { [key: string]: React.CSSProperties } = {
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  formTitle: {
    fontSize: "clamp(20px, 3.5vw, 24px)",
    fontWeight: 800,
    color: "#1e3c72",
    margin: 0,
  },

  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px",
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14.5px",
    boxSizing: "border-box",
    outline: "none",
    background: "#fff",
    color: "#0f172a",
    transition: "border-color 0.2s ease",
  },

  textarea: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14.5px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    background: "#fff",
    color: "#0f172a",
  },

  commentInput: {
    width: "100%",
    padding: "12px 14px",
    marginBottom: "12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    background: "#fff",
  },

  saveBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "15px",
    boxShadow: "0 6px 16px rgba(255, 110, 0, 0.25)",
  },

  cancelBtn: {
    flex: 1,
    padding: "12px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "15px",
  },

  tabs: {
    display: "flex",
    gap: "6px",
    marginBottom: "20px",
    borderBottom: "1.5px solid #e2e8f0",
    paddingBottom: "8px",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    flexWrap: "nowrap",
  },

  tabBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13.5px",
    fontWeight: 600,
    color: "#64748b",
    borderBottom: "2.5px solid transparent",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },

  tabActive: {
    color: "#ff6e00",
    borderBottom: "2.5px solid #ff6e00",
    fontWeight: 700,
  },

  tabContent: {
    minHeight: "200px",
  },

  inputSection: {
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  addItemBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },

  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  commentItem: {
    background: "#f8fafc",
    padding: "14px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
    gap: "8px",
  },

  commentAuthor: {
    color: "#1e3c72",
    fontSize: "13.5px",
    fontWeight: 700,
  },

  commentDate: {
    color: "#94a3b8",
    fontSize: "11.5px",
  },

  commentText: {
    color: "#334155",
    fontSize: "13.5px",
    margin: "6px 0",
    lineHeight: 1.5,
  },

  linkItem: {
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  linkUrl: {
    color: "#2563eb",
    textDecoration: "none",
    fontSize: "13.5px",
    fontWeight: 600,
    wordBreak: "break-all",
  },

  fileItem: {
    background: "#f8fafc",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  deleteItemBtn: {
    padding: "6px 12px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: 600,
    flexShrink: 0,
  },

  imagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "12px",
  },

  imageCard: {
    background: "#f8fafc",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
    padding: "6px",
  },

  image: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "6px",
    display: "block",
  },

  imageTitle: {
    padding: "6px 4px",
    margin: 0,
    fontSize: "12px",
    fontWeight: 600,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  deleteImageBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    fontSize: "12px",
  },

  tableWrapper: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "100%",
    background: "#ffffff",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
  },

  table: {
    width: "max-content",
    minWidth: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "13px",
  },

  th: {
    textAlign: "left",
    padding: "13px 14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1.5px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  thWithIcon: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  infoIcon: {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    border: "1px solid #cbd5e1",
    color: "#94a3b8",
    fontSize: "10px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "none",
  },

  thCenter: {
    textAlign: "center",
    padding: "13px 14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1.5px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  tr: {
    cursor: "pointer",
    transition: "background 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    borderBottom: "1px solid #f1f5f9",
  },

  trActive: {
    background: "#eff6ff",
  },

  td: {
    padding: "10px 14px",
    color: "#334155",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "13px",
  },

  tdAccent: {
    boxShadow: "inset 3px 0 0 0 #3b82f6",
  },

  tdCenter: {
    padding: "10px 12px",
    color: "#64748b",
    textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #f1f5f9",
  },

  tdProjectName: {
    fontSize: "13.5px",
    fontWeight: 700,
    color: "#0f172a",
  },

  tdProjectDesc: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    maxWidth: "280px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  statusBadge: {
    padding: "4px 10px",
    borderRadius: "14px",
    fontSize: "11.5px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  tableActions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
  },

  iconBtnEdit: {
    width: "30px",
    height: "30px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#0284c7",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  iconBtnDelete: {
    width: "30px",
    height: "30px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  sidePanelTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },

  kebabBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    letterSpacing: "-1px",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "2px 6px",
  },

  panelTitle: {
    fontSize: "clamp(20px, 3.5vw, 24px)",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    wordBreak: "break-word",
  },

  breadcrumb: {
    fontSize: "12px",
    color: "#64748b",
    margin: "6px 0 20px 0",
  },

  breadcrumbLink: {
    color: "#3b82f6",
    fontWeight: 600,
  },

  infoSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    marginBottom: "24px",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    alignItems: "center",
  },

  infoLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    background: "#fff",
  },

  iconSquare: {
    width: "20px",
    height: "20px",
    borderRadius: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },

  infoValue: {
    padding: "10px 12px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#f8fafc",
    wordBreak: "break-word",
  },

  infoValuePillWrap: {
    padding: "8px 12px",
    background: "#f8fafc",
  },

  infoInput: {
    padding: "10px 12px",
    fontSize: "13px",
    color: "#0f172a",
    background: "#f8fafc",
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    width: "100%",
    boxSizing: "border-box",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
  },

  emptyIcon: {
    fontSize: "48px",
    margin: "0 0 16px 0",
  },

  emptyText: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1e3c72",
    margin: 0,
  },
};