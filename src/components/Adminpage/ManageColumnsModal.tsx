import React, { useState, useMemo } from "react";
import { FaTimes, FaColumns, FaSearch, FaEye, FaEyeSlash, FaUndo, FaCheck } from "react-icons/fa";
import type { CustomVariable } from "../../lib/api";

interface ManageColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hiddenColumns: string[];
  onToggleColumn: (key: string) => void;
  onResetAll: () => void;
  customVariables: CustomVariable[];
  fieldLabels: Record<string, string>;
}

interface ColumnDef {
  key: string;
  label: string;
  category: string;
  isCustom?: boolean;
}

export const ManageColumnsModal: React.FC<ManageColumnsModalProps> = ({
  isOpen,
  onClose,
  hiddenColumns,
  onToggleColumn,
  onResetAll,
  customVariables,
  fieldLabels,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getLabel = (k: string, fallback: string) => fieldLabels[k] || fallback;

  const allColumns: ColumnDef[] = useMemo(() => {
    const list: ColumnDef[] = [
      { key: "name", label: getLabel("name", "Project Title"), category: "General" },
      { key: "priority", label: getLabel("priority", "Priority"), category: "General" },
      { key: "projectType", label: getLabel("projectType", "Project Type"), category: "General" },
      { key: "contractor", label: getLabel("contractor", "Contractor"), category: "General" },
      { key: "status", label: getLabel("status", "Board Status"), category: "General" },

      { key: "submittedDate", label: getLabel("submittedDate", "Submitted Date"), category: "Dates" },
      { key: "date", label: getLabel("date", "Target Date"), category: "Dates" },
      { key: "timeSpent", label: getLabel("timeSpent", "Time Spent (Temps passé)"), category: "Dates" },
      { key: "targetDuration", label: getLabel("targetDuration", "Target Duration (Durée prévue)"), category: "Dates" },

      { key: "pmName", label: getLabel("pmName", "PM Name"), category: "Team" },
      { key: "pmEmails", label: getLabel("pmEmails", "PM Emails"), category: "Team" },
      { key: "drafterName", label: getLabel("drafterName", "Drafter Name"), category: "Team" },
      { key: "drafterEmails", label: getLabel("drafterEmails", "Drafter Emails"), category: "Team" },

      { key: "structEngi", label: getLabel("structEngi", "Struct Engi"), category: "Engineering & Stages" },
      { key: "seTime", label: getLabel("seTime", "SE Time"), category: "Engineering & Stages" },
      { key: "pmStatus", label: getLabel("pmStatus", "PM Status"), category: "Engineering & Stages" },
      { key: "draftingStatus", label: getLabel("draftingStatus", "Drafting Status"), category: "Engineering & Stages" },
      { key: "qaAndDeliveryStatus", label: getLabel("qaAndDeliveryStatus", "QA & Delivery"), category: "Engineering & Stages" },
      { key: "idReview", label: getLabel("idReview", "I&D Review"), category: "Engineering & Stages" },
      { key: "peerReview", label: getLabel("peerReview", "Peer Review"), category: "Engineering & Stages" },
      { key: "rfiStatus", label: getLabel("rfiStatus", "RFI Status"), category: "Engineering & Stages" },
      { key: "projectSs", label: getLabel("projectSs", "Site Survey (SS)"), category: "Engineering & Stages" },
      { key: "updates", label: getLabel("updates", "Updates / Notes"), category: "Engineering & Stages" },

      { key: "files", label: "Files", category: "Files & Comments" },
      { key: "comments", label: "Comments", category: "Files & Comments" },
    ];

    // Add custom dynamic variables
    customVariables.forEach((cv) => {
      list.push({
        key: `custom_${cv.key}`,
        label: cv.name,
        category: "Custom Variables",
        isCustom: true,
      });
    });

    return list;
  }, [customVariables, fieldLabels]);

  if (!isOpen) return null;

  const filteredColumns = allColumns.filter(
    (c) =>
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group columns by category
  const categories = Array.from(new Set(filteredColumns.map((c) => c.category)));

  const hiddenCount = hiddenColumns.length;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1150,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)",
          maxWidth: "700px",
          width: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "18px",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)",
              }}
            >
              <FaColumns />
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
                Manage Table Columns
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                Toggle which columns are displayed in the projects table.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
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
            <FaTimes />
          </button>
        </div>

        {/* TOOLBAR */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "6px 12px",
              flex: 1,
              minWidth: "220px",
            }}
          >
            <FaSearch style={{ color: "#94a3b8", fontSize: "12px" }} />
            <input
              type="text"
              placeholder="Search column..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "13px",
                color: "#0f172a",
                width: "100%",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "12px",
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {hiddenCount > 0 && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#dc2626",
                  background: "#fee2e2",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid #fecaca",
                }}
              >
                {hiddenCount} hidden
              </span>
            )}
            <button
              onClick={onResetAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#334155",
                fontSize: "12.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Show all columns"
            >
              <FaUndo style={{ fontSize: "11px", color: "#2563eb" }} /> Restore All
            </button>
          </div>
        </div>

        {/* COLUMN LIST (SCROLLABLE) */}
        <div style={{ padding: "18px 24px", overflowY: "auto", flex: 1 }}>
          {categories.map((cat) => {
            const cols = filteredColumns.filter((c) => c.category === cat);
            return (
              <div key={cat} style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    color: "#64748b",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    ({cols.filter((c) => !hiddenColumns.includes(c.key)).length}/{cols.length} shown)
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "8px",
                  }}
                >
                  {cols.map((col) => {
                    const isVisible = !hiddenColumns.includes(col.key);
                    return (
                      <div
                        key={col.key}
                        onClick={() => onToggleColumn(col.key)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          border: `1.5px solid ${isVisible ? "#bfdbfe" : "#e2e8f0"}`,
                          background: isVisible ? "#eff6ff" : "#f8fafc",
                          cursor: "pointer",
                          userSelect: "none",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                          <div
                            style={{
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              border: `1.5px solid ${isVisible ? "#2563eb" : "#cbd5e1"}`,
                              background: isVisible ? "#2563eb" : "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "10px",
                              flexShrink: 0,
                            }}
                          >
                            {isVisible && <FaCheck />}
                          </div>

                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: isVisible ? 700 : 500,
                              color: isVisible ? "#1e293b" : "#94a3b8",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              textDecoration: isVisible ? "none" : "line-through",
                            }}
                            title={col.label}
                          >
                            {col.label}
                          </span>
                        </div>

                        <div style={{ flexShrink: 0, marginLeft: "6px" }}>
                          {isVisible ? (
                            <FaEye style={{ fontSize: "12px", color: "#2563eb" }} />
                          ) : (
                            <FaEyeSlash style={{ fontSize: "12px", color: "#94a3b8" }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredColumns.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: "13px" }}>
              No columns match "{searchTerm}"
            </div>
          )}
        </div>

        {/* FOOTER */}
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
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
            {allColumns.length - hiddenCount} of {allColumns.length} columns displayed
          </span>
          <button
            onClick={onClose}
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
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
