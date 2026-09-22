import React, { useState, useEffect, useMemo } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFolderOpen,
  FaSearch,
  FaTimes,
  FaExternalLinkAlt,
  FaHardHat,
  FaProjectDiagram,
  FaCheckCircle,
  FaClock,
} from "react-icons/fa";
import {
  getContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  getContractorProjects,
  type Contractor,
  type Project,
} from "../../lib/api";

interface ContractorsProps {
  onSelectProject?: (projectId: string) => void;
}

export default function Contractors({ onSelectProject }: ContractorsProps) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Associated Projects Modal
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [contractorProjects, setContractorProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  const loadContractors = () => {
    setIsLoading(true);
    getContractors()
      .then(setContractors)
      .catch((err) => alert(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadContractors();
  }, []);

  const resetForm = () => {
    setNom("");
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      alert("Please enter a contractor name!");
      return;
    }

    try {
      if (editingId) {
        const updated = await updateContractor(editingId, { nom: nom.trim() });
        setContractors(contractors.map((c) => (c._id === editingId ? { ...c, ...updated } : c)));
      } else {
        const created = await createContractor({ nom: nom.trim() });
        setContractors([created, ...contractors]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "An error occurred while saving contractor");
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setNom(contractor.nom);
    setEditingId(contractor._id);
    setShowForm(true);
  };

  const handleDelete = async (contractor: Contractor) => {
    const pCount = contractor.projectCount || 0;
    const confirmMsg =
      pCount > 0
        ? `⚠️ This contractor is linked to ${pCount} project(s). Are you sure you want to delete it?`
        : `Are you sure you want to delete contractor "${contractor.nom}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteContractor(contractor._id);
      setContractors(contractors.filter((c) => c._id !== contractor._id));
      if (selectedContractor?._id === contractor._id) {
        setSelectedContractor(null);
      }
    } catch (err: any) {
      alert(err.message || "Error deleting contractor");
    }
  };

  // Open Associated Projects Modal
  const handleOpenProjects = async (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsLoadingProjects(true);
    setProjectSearch("");
    try {
      const projs = await getContractorProjects(contractor._id);
      setContractorProjects(projs || []);
    } catch (err: any) {
      console.error("Error fetching contractor projects:", err);
      alert(err.message || "Unable to load projects for this contractor");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Filter contractors by search
  const filteredContractors = useMemo(() => {
    if (!searchQuery.trim()) return contractors;
    const q = searchQuery.toLowerCase();
    return contractors.filter((c) => c.nom.toLowerCase().includes(q));
  }, [contractors, searchQuery]);

  // Filter projects inside modal
  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return contractorProjects;
    const q = projectSearch.toLowerCase();
    return contractorProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.status && p.status.toLowerCase().includes(q)) ||
        (p.priority && p.priority.toLowerCase().includes(q))
    );
  }, [contractorProjects, projectSearch]);

  // Quick statistics
  const totalContractors = contractors.length;
  const totalProjectsLinked = contractors.reduce((acc, c) => acc + (c.projectCount || 0), 0);
  const activeContractors = contractors.filter((c) => (c.projectCount || 0) > 0).length;

  // Helper status color badge
  const getStatusBadgeStyle = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("complét") || s.includes("complet")) {
      return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
    }
    if (s.includes("cours") || s.includes("processing") || s.includes("progress")) {
      return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    }
    if (s.includes("attente") || s.includes("discovery") || s.includes("initiat")) {
      return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    }
    return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
  };

  return (
    <div className="admin-projects-section" style={{ border: "1.5px solid #eef2f6", padding: "24px" }}>
      {/* 1. HEADER & ACTIONS */}
      <div style={styles.headerRow}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.headerIconBadge}>
              <FaHardHat style={{ fontSize: "20px", color: "#ff6e00" }} />
            </div>
            <div>
              <h2 className="admin-main-title" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", margin: 0 }}>
                Contractors Management
              </h2>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
                Manage contractors and monitor all associated projects in real time.
              </p>
            </div>
          </div>
        </div>

        <button className="admin-btn-primary" onClick={() => setShowForm(true)} style={styles.primaryBtn}>
          <FaPlus style={{ fontSize: "13px" }} /> Add Contractor
        </button>
      </div>

      {/* 2. STATS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(255, 110, 0, 0.12)", color: "#ff6e00" }}>
            <FaHardHat />
          </div>
          <div>
            <div style={styles.statValue}>{totalContractors}</div>
            <div style={styles.statLabel}>Total Contractors</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
            <FaProjectDiagram />
          </div>
          <div>
            <div style={styles.statValue}>{totalProjectsLinked}</div>
            <div style={styles.statLabel}>Linked Projects</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <FaCheckCircle />
          </div>
          <div>
            <div style={styles.statValue}>{activeContractors}</div>
            <div style={styles.statLabel}>Active Contractors</div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CONTROLS */}
      <div style={styles.searchBarRow}>
        <div style={styles.searchContainer}>
          <FaSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search contractors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button style={styles.clearSearchBtn} onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
        <div style={{ fontSize: "13.5px", color: "#64748b", fontWeight: 600 }}>
          Showing {filteredContractors.length} contractor(s)
        </div>
      </div>

      {/* 4. MODAL: ADD / EDIT CONTRACTOR */}
      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "480px" }}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {editingId ? "✏️ Edit Contractor" : "➕ New Contractor"}
              </h3>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 700, color: "#334155" }}>
                Contractor Name *
              </label>
              <input
                type="text"
                placeholder="e.g. SunPower Solutions Inc."
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                style={styles.input}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>

            <div className="admin-form-actions">
              <button style={styles.saveBtn} onClick={handleSave}>
                {editingId ? "Save Changes" : "Create Contractor"}
              </button>
              <button style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: ASSOCIATED PROJECTS LIST */}
      {selectedContractor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "850px", width: "95%", maxHeight: "88vh", display: "flex", flexDirection: "column" }}>
            {/* Modal Header */}
            <div style={styles.projectsModalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={styles.modalContractorIcon}>
                  <FaFolderOpen style={{ color: "#ff6e00", fontSize: "20px" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "19px", color: "#0f172a", fontWeight: 800 }}>
                    {selectedContractor.nom}
                  </h3>
                  <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    Projects associated with this contractor ({contractorProjects.length} project(s))
                  </p>
                </div>
              </div>

              <button
                style={styles.closeBtn}
                onClick={() => setSelectedContractor(null)}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: "12px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <div style={styles.searchContainer}>
                <FaSearch style={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Filter projects by name, status, priority..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  style={{ ...styles.searchInput, background: "#ffffff" }}
                />
                {projectSearch && (
                  <button style={styles.clearSearchBtn} onClick={() => setProjectSearch("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Modal Projects Table / Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {isLoadingProjects ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                  <p style={{ fontSize: "15px", fontWeight: 600 }}>Loading associated projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                    {projectSearch ? "No projects match your search query" : "No associated projects"}
                  </p>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    {projectSearch
                      ? "Try adjusting your search criteria."
                      : "This contractor currently has no assigned projects."}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Project Name</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Priority</th>
                        <th style={styles.th}>Target Date</th>
                        <th style={styles.th}>Team (PM / Drafter)</th>
                        {onSelectProject && <th style={{ ...styles.th, textAlign: "right" }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((proj) => {
                        const bStyle = getStatusBadgeStyle(proj.status);
                        return (
                          <tr key={proj._id} style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: 700, color: "#0f172a" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff6e00" }}></span>
                                <span>{proj.name}</span>
                              </div>
                              {proj.description && (
                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", fontWeight: 400 }}>
                                  {proj.description.slice(0, 60)}{proj.description.length > 60 ? "..." : ""}
                                </div>
                              )}
                            </td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "3px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  background: bStyle.bg,
                                  color: bStyle.color,
                                  border: `1px solid ${bStyle.border}`,
                                }}
                              >
                                {proj.status || "Pending"}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569" }}>
                                {proj.priority || "Medium"}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#334155" }}>
                                <FaClock style={{ color: "#94a3b8", fontSize: "11px" }} />
                                <span>{proj.date || "N/A"}</span>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontSize: "12px", color: "#475569" }}>
                                {proj.pmName && <div><strong>PM:</strong> {proj.pmName}</div>}
                                {proj.drafterName && <div><strong>Drafter:</strong> {proj.drafterName}</div>}
                                {!proj.pmName && !proj.drafterName && <span style={{ color: "#94a3b8" }}>—</span>}
                              </div>
                            </td>
                            {onSelectProject && (
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                <button
                                  onClick={() => {
                                    setSelectedContractor(null);
                                    onSelectProject(proj._id);
                                  }}
                                  style={styles.openProjectBtn}
                                  title="Open project in dashboard"
                                >
                                  <span>Open</span>
                                  <FaExternalLinkAlt style={{ fontSize: "10px" }} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={styles.projectsModalFooter}>
              <span style={{ fontSize: "12.5px", color: "#64748b" }}>
                Total: <strong>{filteredProjects.length}</strong> project(s) displayed
              </span>
              <button
                onClick={() => setSelectedContractor(null)}
                style={styles.closeModalBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONTRACTORS TABLE */}
      {isLoading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Loading contractors...</p>
        </div>
      ) : contractors.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📭</p>
          <p style={styles.emptyText}>No contractors yet</p>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
            Click "Add Contractor" above to add your first contractor.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={styles.th}>Contractor</th>
                <th style={styles.th}>Associated Projects</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractors.map((contractor) => {
                const count = contractor.projectCount || 0;
                return (
                  <tr key={contractor._id} style={styles.tr}>
                    {/* Contractor Name with Icon */}
                    <td style={{ ...styles.td, ...styles.tdAccent }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={styles.avatarBadge}>
                          {contractor.nom.trim().charAt(0).toUpperCase() || "C"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14.5px" }}>
                            {contractor.nom}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                            ID: {contractor._id.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Associated Projects Count Badge */}
                    <td style={styles.td}>
                      <button
                        onClick={() => handleOpenProjects(contractor)}
                        style={{
                          ...styles.projectCountBadge,
                          background: count > 0 ? "#eff6ff" : "#f8fafc",
                          color: count > 0 ? "#1d4ed8" : "#64748b",
                          borderColor: count > 0 ? "#bfdbfe" : "#e2e8f0",
                        }}
                        title={`View ${count} linked project(s)`}
                      >
                        <FaFolderOpen style={{ color: count > 0 ? "#2563eb" : "#94a3b8", fontSize: "13px" }} />
                        <span>
                          {count === 0
                            ? "0 Projects"
                            : count === 1
                            ? "1 Linked project"
                            : `${count} Linked projects`}
                        </span>
                        <span style={styles.badgeArrow}>→</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      <div style={styles.tableActions}>
                        {/* View Projects Button */}
                        <button
                          style={styles.iconBtnView}
                          onClick={() => handleOpenProjects(contractor)}
                          title="View projects list"
                        >
                          <FaFolderOpen />
                          <span style={{ fontSize: "12px", marginLeft: "4px" }}>Projects</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          style={styles.iconBtnEdit}
                          onClick={() => handleEdit(contractor)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>

                        {/* Delete Button */}
                        <button
                          style={styles.iconBtnDelete}
                          onClick={() => handleDelete(contractor)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "14px",
    flexWrap: "wrap",
  },

  headerIconBadge: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    background: "rgba(255, 110, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 3px 10px rgba(255, 110, 0, 0.25)",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
  },

  statIconContainer: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },

  statValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.1,
  },

  statLabel: {
    fontSize: "12.5px",
    color: "#64748b",
    fontWeight: 600,
    marginTop: "3px",
  },

  searchBarRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    gap: "12px",
    flexWrap: "wrap",
  },

  searchContainer: {
    position: "relative",
    flex: "1",
    maxWidth: "380px",
  },

  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "13px",
  },

  searchInput: {
    width: "100%",
    padding: "9px 32px 9px 34px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13.5px",
    outline: "none",
    boxSizing: "border-box",
    color: "#0f172a",
    transition: "border 0.15s ease",
  },

  clearSearchBtn: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "13px",
    cursor: "pointer",
  },

  avatarBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
    color: "#c2410c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "15px",
    flexShrink: 0,
    boxShadow: "0 1px 3px rgba(255, 110, 0, 0.15)",
  },

  projectCountBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
    border: "1px solid",
    transition: "all 0.15s ease",
  },

  badgeArrow: {
    fontSize: "11px",
    opacity: 0.7,
  },

  tableActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  iconBtnView: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  iconBtnEdit: {
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5f9",
    color: "#0284c7",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },

  iconBtnDelete: {
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    paddingBottom: "12px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  formTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#1e3c72",
    margin: 0,
  },

  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    borderRadius: "4px",
  },

  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    color: "#0f172a",
    background: "#fff",
  },

  saveBtn: {
    flex: 1,
    padding: "11px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(255, 110, 0, 0.25)",
  },

  cancelBtn: {
    flex: 1,
    padding: "11px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },

  // Modal Projects List Styles
  projectsModalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 20px",
    borderBottom: "1.5px solid #e2e8f0",
    background: "#ffffff",
  },

  modalContractorIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    background: "rgba(255, 110, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  projectsModalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1.5px solid #e2e8f0",
    background: "#f8fafc",
  },

  closeModalBtn: {
    padding: "8px 18px",
    background: "#ffffff",
    border: "1.5px solid #cbd5e1",
    borderRadius: "6px",
    color: "#334155",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
  },

  openProjectBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    background: "#ff6e00",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "11.5px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },

  th: {
    textAlign: "left",
    padding: "12px 16px",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1.5px solid #e2e8f0",
    whiteSpace: "nowrap",
  },

  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s ease",
  },

  td: {
    padding: "12px 16px",
    color: "#334155",
    verticalAlign: "middle",
    fontSize: "13.5px",
  },

  tdAccent: {
    fontSize: "14.5px",
    fontWeight: 700,
    color: "#0f172a",
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
    fontSize: "18px",
    fontWeight: 700,
    color: "#1e3c72",
    margin: 0,
  },
};
