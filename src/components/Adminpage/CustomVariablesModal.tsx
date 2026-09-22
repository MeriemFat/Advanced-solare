import React, { useState } from "react";
import { FaTimes, FaPlus, FaTrash, FaCalendarAlt, FaHashtag, FaFont } from "react-icons/fa";
import type { CustomVariable, CustomVariableType } from "../../lib/api";
import { createCustomVariable, deleteCustomVariable } from "../../lib/api";

interface CustomVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: CustomVariable[];
  onVariablesChange: (variables: CustomVariable[]) => void;
}

export const CustomVariablesModal: React.FC<CustomVariablesModalProps> = ({
  isOpen,
  onClose,
  variables,
  onVariablesChange,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomVariableType>("string");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a variable name.");
      return;
    }

    if (variables.some((v) => v.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError(`A variable named "${trimmed}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createCustomVariable({ name: trimmed, type });
      onVariablesChange([...variables, created]);
      setName("");
      setType("string");
    } catch (err: any) {
      setError(err.message || "Failed to create custom variable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (variable: CustomVariable) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the variable "${variable.name}"? This column will be removed from the table.`
      )
    ) {
      return;
    }

    try {
      await deleteCustomVariable(variable._id);
      onVariablesChange(variables.filter((v) => v._id !== variable._id));
    } catch (err: any) {
      alert(err.message || "Failed to delete variable");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "fadeInDown 0.2s ease",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
              Dynamic Table Variables
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
              Add and manage custom columns dynamically in the project table.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "18px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0f172a")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {/* Add New Variable Form */}
          <form onSubmit={handleCreate} style={{ marginBottom: "24px" }}>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Variable Name / Column Label
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Budget, Permit #, Inspection Date..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border 0.2s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
              />
            </div>

            {/* Type Selector */}
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#334155",
                  marginBottom: "8px",
                }}
              >
                Variable Type
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                }}
              >
                {/* String */}
                <button
                  type="button"
                  onClick={() => setType("string")}
                  style={{
                    padding: "12px 10px",
                    borderRadius: "12px",
                    border: type === "string" ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: type === "string" ? "#eff6ff" : "#f8fafc",
                    color: type === "string" ? "#1d4ed8" : "#475569",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaFont style={{ fontSize: "16px", color: type === "string" ? "#2563eb" : "#64748b" }} />
                  <span>String (Text)</span>
                </button>

                {/* Number */}
                <button
                  type="button"
                  onClick={() => setType("number")}
                  style={{
                    padding: "12px 10px",
                    borderRadius: "12px",
                    border: type === "number" ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: type === "number" ? "#eff6ff" : "#f8fafc",
                    color: type === "number" ? "#1d4ed8" : "#475569",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaHashtag style={{ fontSize: "16px", color: type === "number" ? "#2563eb" : "#64748b" }} />
                  <span>Numeric</span>
                </button>

                {/* Date */}
                <button
                  type="button"
                  onClick={() => setType("date")}
                  style={{
                    padding: "12px 10px",
                    borderRadius: "12px",
                    border: type === "date" ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                    background: type === "date" ? "#eff6ff" : "#f8fafc",
                    color: type === "date" ? "#1d4ed8" : "#475569",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    fontSize: "12.5px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FaCalendarAlt style={{ fontSize: "16px", color: type === "date" ? "#2563eb" : "#64748b" }} />
                  <span>Date</span>
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontSize: "12.5px",
                  marginBottom: "14px",
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <FaPlus /> {isSubmitting ? "Adding Column..." : "Add Column to Table"}
            </button>
          </form>

          {/* Active Custom Variables List */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#475569" }}>
                Active Dynamic Columns ({variables.length})
              </span>
            </div>

            {variables.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                No dynamic columns added yet. Create one above to add it to the table!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {variables.map((variable) => (
                  <div
                    key={variable._id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "30px",
                          height: "30px",
                          borderRadius: "8px",
                          background:
                            variable.type === "number"
                              ? "#fef3c7"
                              : variable.type === "date"
                              ? "#ecfdf5"
                              : "#eff6ff",
                          color:
                            variable.type === "number"
                              ? "#d97706"
                              : variable.type === "date"
                              ? "#059669"
                              : "#2563eb",
                          fontSize: "13px",
                          flexShrink: 0,
                        }}
                      >
                        {variable.type === "number" ? (
                          <FaHashtag />
                        ) : variable.type === "date" ? (
                          <FaCalendarAlt />
                        ) : (
                          <FaFont />
                        )}
                      </span>
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
                        >
                          {variable.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          Type: <strong>{variable.type}</strong> • Field key:{" "}
                          <code>{variable.key}</code>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(variable)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                      title="Delete this dynamic column"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "flex-end",
            background: "#fafbfd",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
