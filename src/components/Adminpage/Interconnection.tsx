import React, { useState, useEffect, useMemo } from "react";
import {
  FaNetworkWired,
  FaCheckCircle,
  FaHourglassHalf,
  FaSearch,
  FaEdit,
  FaExternalLinkAlt,
  FaTimes,
  FaFilter,
  FaDownload,
  FaBuilding,
  FaBolt,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  getProjects,
  getContractors,
  updateProjectInterconnection,
  updateProjectInvoice,
  type Project,
  type Contractor,
} from "../../lib/api";

interface InterconnectionProps {
  onSelectProject?: (projectId: string) => void;
  canEdit?: boolean;
}

const getProjectAddress = (p: Project): string => {
  return (
    p.customFields?.["adresse"] ||
    p.customFields?.["Adresse"] ||
    p.customFields?.["address"] ||
    p.customFields?.["Address"] ||
    (p as any).adresse ||
    (p as any).address ||
    ""
  );
};

export default function Interconnection({ onSelectProject, canEdit = true }: InterconnectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [activeTab, setActiveTab] = useState<
    "all" | "not_started" | "in_review" | "approved" | "action_required"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>("all");
  const [selectedUtility, setSelectedUtility] = useState<string>("all");
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState<string>("all");

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formStatus, setFormStatus] = useState<string>("Not Started");
  const [formUtility, setFormUtility] = useState<string>("");
  const [formAppNumber, setFormAppNumber] = useState<string>("");
  const [formSubmissionDate, setFormSubmissionDate] = useState<string>("");
  const [formApprovalDate, setFormApprovalDate] = useState<string>("");
  const [formPtoStatus, setFormPtoStatus] = useState<string>("Pending");
  const [formFee, setFormFee] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formInvoiceStatus, setFormInvoiceStatus] = useState<string>("Not Invoiced");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Projects & Contractors
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projs, conts] = await Promise.all([getProjects(), getContractors()]);
      setProjects(projs || []);
      setContractors(conts || []);
    } catch (err: any) {
      console.error("Error loading interconnection data:", err);
      alert(err.message || "Failed to load projects data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit Modal
  const handleOpenEdit = (project: Project) => {
    if (!canEdit) {
      alert("Vous n'avez pas l'autorisation de modifier les interconnexions.");
      return;
    }
    setEditingProject(project);
    setFormStatus(project.interconnectionStatus || "Not Started");
    setFormUtility(project.utilityProvider || "");
    setFormAppNumber(project.interconnectionAppNumber || "");
    setFormSubmissionDate(project.interconnectionSubmissionDate || "");
    setFormApprovalDate(project.interconnectionApprovalDate || "");
    setFormPtoStatus(project.interconnectionPtoStatus || "Pending");
    setFormFee(
      project.interconnectionFee !== undefined && project.interconnectionFee !== null
        ? String(project.interconnectionFee)
        : ""
    );
    setFormNotes(project.interconnectionNotes || "");
    setFormInvoiceStatus(
      project.invoiceStatus || (project.isInvoiced ? "Invoiced" : "Not Invoiced")
    );
  };

  // Quick Interconnection Status Change directly from the table
  const handleQuickStatusChange = async (project: Project, newStatus: string) => {
    if (!canEdit) {
      alert("Vous n'avez pas l'autorisation de modifier les interconnexions.");
      return;
    }
    const isSubmitted = ["Submitted", "Under Review", "Approved", "PTO Granted"].includes(newStatus);
    const today = new Date().toISOString().slice(0, 10);

    try {
      const updated = await updateProjectInterconnection(project._id, {
        interconnectionStatus: newStatus,
        isInterconnectionSubmitted: isSubmitted,
        interconnectionSubmissionDate:
          isSubmitted && !project.interconnectionSubmissionDate ? today : project.interconnectionSubmissionDate,
        interconnectionApprovalDate:
          (newStatus === "Approved" || newStatus === "PTO Granted") && !project.interconnectionApprovalDate
            ? today
            : project.interconnectionApprovalDate,
        interconnectionPtoStatus: newStatus === "PTO Granted" ? "Granted" : project.interconnectionPtoStatus || "Pending",
      });

      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, ...updated } : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update interconnection status");
    }
  };

  // Quick Invoice Status Change directly from the table (Relationship with Invoices)
  const handleQuickInvoiceChange = async (project: Project, newInvoiceStatus: string) => {
    const isInvoiced = newInvoiceStatus === "Invoiced" || newInvoiceStatus === "Paid";
    try {
      const updated = await updateProjectInvoice(project._id, {
        invoiceStatus: newInvoiceStatus,
        isInvoiced,
      });

      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, ...updated } : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update invoice status");
    }
  };

  // Generate Suggested Application Number
  const handleGenerateAppNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormAppNumber(`INT-${year}-${rand}`);
  };

  // Save Modal
  const handleSaveInterconnection = async () => {
    if (!editingProject) return;

    setIsSaving(true);
    try {
      const feeNum = formFee.trim() ? parseFloat(formFee) : 0;
      const isSubmitted = ["Submitted", "Under Review", "Approved", "PTO Granted"].includes(formStatus);
      const isInvoiced = formInvoiceStatus === "Invoiced" || formInvoiceStatus === "Paid";

      const updated = await updateProjectInterconnection(editingProject._id, {
        isInterconnectionSubmitted: isSubmitted,
        interconnectionStatus: formStatus,
        utilityProvider: formUtility.trim(),
        interconnectionAppNumber: formAppNumber.trim(),
        interconnectionSubmissionDate: formSubmissionDate,
        interconnectionApprovalDate: formApprovalDate,
        interconnectionPtoStatus: formPtoStatus,
        interconnectionFee: isNaN(feeNum) ? 0 : feeNum,
        interconnectionNotes: formNotes.trim(),
        isInvoiced,
        invoiceStatus: formInvoiceStatus,
      });

      setProjects((prev) =>
        prev.map((p) => (p._id === editingProject._id ? { ...p, ...updated } : p))
      );
      setEditingProject(null);
    } catch (err: any) {
      alert(err.message || "Failed to save interconnection details");
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Project Name",
      "Address",
      "Contractor",
      "Utility Provider",
      "Interconnection Status",
      "Invoice Status",
      "Invoiced (Yes/No)",
      "App Number",
      "Submission Date",
      "Approval Date",
      "PTO Status",
      "Fee ($)",
      "Notes",
    ];

    const rows = filteredProjects.map((p) => {
      const pInvStatus = p.invoiceStatus || (p.isInvoiced ? "Invoiced" : "Not Invoiced");
      const pIsInvoiced = Boolean(p.isInvoiced || p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid");

      return [
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${(getProjectAddress(p) || "").replace(/"/g, '""')}"`,
        `"${(p.contractor?.nom || "").replace(/"/g, '""')}"`,
        `"${(p.utilityProvider || "").replace(/"/g, '""')}"`,
        `"${p.interconnectionStatus || "Not Started"}"`,
        `"${pInvStatus}"`,
        `"${pIsInvoiced ? "Yes" : "No"}"`,
        `"${p.interconnectionAppNumber || ""}"`,
        `"${p.interconnectionSubmissionDate || ""}"`,
        `"${p.interconnectionApprovalDate || ""}"`,
        `"${p.interconnectionPtoStatus || "Pending"}"`,
        p.interconnectionFee || 0,
        `"${(p.interconnectionNotes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `interconnections_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Extract unique utility providers
  const availableUtilities = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.utilityProvider && p.utilityProvider.trim()) {
        set.add(p.utilityProvider.trim());
      }
    });
    return Array.from(set).sort();
  }, [projects]);

  // Statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const notStartedCount = projects.filter(
      (p) =>
        !p.interconnectionStatus ||
        p.interconnectionStatus === "Not Started" ||
        p.interconnectionStatus === "Documents Gathering"
    ).length;

    const inReviewCount = projects.filter(
      (p) =>
        p.interconnectionStatus === "Submitted" ||
        p.interconnectionStatus === "Under Review"
    ).length;

    const approvedCount = projects.filter(
      (p) =>
        p.interconnectionStatus === "Approved" ||
        p.interconnectionStatus === "PTO Granted"
    ).length;

    const actionRequiredCount = projects.filter(
      (p) => p.interconnectionStatus === "Action Required"
    ).length;

    const invoicedCount = projects.filter(
      (p) => p.isInvoiced || p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid"
    ).length;

    const totalFees = projects.reduce((acc, p) => acc + (p.interconnectionFee || 0), 0);
    const approvedRate = total > 0 ? Math.round((approvedCount / total) * 100) : 0;
    const invoicedRate = total > 0 ? Math.round((invoicedCount / total) * 100) : 0;

    return {
      total,
      notStartedCount,
      inReviewCount,
      approvedCount,
      actionRequiredCount,
      invoicedCount,
      invoicedRate,
      totalFees,
      approvedRate,
    };
  }, [projects]);

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const status = p.interconnectionStatus || "Not Started";
      const invStatus = p.invoiceStatus || (p.isInvoiced ? "Invoiced" : "Not Invoiced");

      // Tab filter
      if (activeTab === "not_started" && status !== "Not Started" && status !== "Documents Gathering") {
        return false;
      }
      if (activeTab === "in_review" && status !== "Submitted" && status !== "Under Review") {
        return false;
      }
      if (activeTab === "approved" && status !== "Approved" && status !== "PTO Granted") {
        return false;
      }
      if (activeTab === "action_required" && status !== "Action Required") {
        return false;
      }

      // Contractor filter
      if (selectedContractorId !== "all") {
        if (!p.contractor || p.contractor._id !== selectedContractorId) return false;
      }

      // Utility filter
      if (selectedUtility !== "all") {
        if (!p.utilityProvider || p.utilityProvider.trim().toLowerCase() !== selectedUtility.trim().toLowerCase()) {
          return false;
        }
      }

      // Invoice status filter (Relationship with Invoices)
      if (selectedInvoiceFilter !== "all") {
        if (selectedInvoiceFilter === "invoiced" && invStatus !== "Invoiced" && invStatus !== "Paid") {
          return false;
        }
        if (selectedInvoiceFilter === "not_invoiced" && (invStatus === "Invoiced" || invStatus === "Paid")) {
          return false;
        }
        if (selectedInvoiceFilter === "paid" && invStatus !== "Paid") {
          return false;
        }
        if (selectedInvoiceFilter === "pending" && invStatus !== "Pending") {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesContractor = p.contractor?.nom?.toLowerCase().includes(q);
        const matchesAppNum = p.interconnectionAppNumber?.toLowerCase().includes(q);
        const matchesUtility = p.utilityProvider?.toLowerCase().includes(q);
        const matchesStatus = status.toLowerCase().includes(q);
        const matchesInvStatus = invStatus.toLowerCase().includes(q);
        const matchesAddr = getProjectAddress(p).toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesContractor &&
          !matchesAppNum &&
          !matchesUtility &&
          !matchesStatus &&
          !matchesInvStatus &&
          !matchesAddr
        ) {
          return false;
        }
      }

      return true;
    });
  }, [projects, activeTab, selectedContractorId, selectedUtility, selectedInvoiceFilter, searchQuery]);

  return (
    <div className="admin-projects-section" style={{ border: "1.5px solid #eef2f6", padding: "24px" }}>
      {/* 1. HEADER & ACTIONS */}
      <div style={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={styles.headerIconBadge}>
            <FaNetworkWired style={{ fontSize: "22px", color: "#0284c7" }} />
          </div>
          <div>
            <h2 className="admin-main-title" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", margin: 0 }}>
              Interconnection & Grid Approvals
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={handleExportCSV} style={styles.exportBtn} title="Export current list to CSV">
            <FaDownload style={{ fontSize: "12px" }} /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div style={styles.statsGrid}>
        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "all" ? "#0284c7" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("all")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}>
            <FaNetworkWired />
          </div>
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Projects</div>
          </div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "not_started" ? "#f59e0b" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("not_started")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <FaHourglassHalf />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#d97706" }}>{stats.notStartedCount}</div>
            <div style={styles.statLabel}>Pending Submission</div>
          </div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "in_review" ? "#6366f1" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("in_review")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
            <FaBolt />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#4f46e5" }}>{stats.inReviewCount}</div>
            <div style={styles.statLabel}>In Utility Review</div>
          </div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "approved" ? "#10b981" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("approved")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <FaCheckCircle />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#059669" }}>
              {stats.approvedCount}{" "}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                ({stats.approvedRate}%)
              </span>
            </div>
            <div style={styles.statLabel}>Approved / PTO Granted</div>
          </div>
        </div>

        {/* Invoice status relation stat card */}
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(255, 110, 0, 0.12)", color: "#ff6e00" }}>
            <FaFileInvoiceDollar />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#ff6e00" }}>
              {stats.invoicedCount}{" "}
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                ({stats.invoicedRate}%)
              </span>
            </div>
            <div style={styles.statLabel}>Invoiced (Invoices Module)</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(14, 165, 233, 0.12)", color: "#0284c7" }}>
            <FaMoneyBillWave />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#0f172a" }}>
              ${stats.totalFees.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={styles.statLabel}>Total Grid Fees</div>
          </div>
        </div>
      </div>

      {/* 3. FILTERS BAR */}
      <div style={styles.filterSection}>
        {/* Tab Pills */}
        <div style={styles.tabPillsContainer}>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "all" ? "#0f172a" : "#f1f5f9",
              color: activeTab === "all" ? "#ffffff" : "#475569",
            }}
            onClick={() => setActiveTab("all")}
          >
            All ({stats.total})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "not_started" ? "#f59e0b" : "#f1f5f9",
              color: activeTab === "not_started" ? "#ffffff" : "#475569",
            }}
            onClick={() => setActiveTab("not_started")}
          >
            Pending ({stats.notStartedCount})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "in_review" ? "#6366f1" : "#f1f5f9",
              color: activeTab === "in_review" ? "#ffffff" : "#475569",
            }}
            onClick={() => setActiveTab("in_review")}
          >
            In Review ({stats.inReviewCount})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "approved" ? "#10b981" : "#f1f5f9",
              color: activeTab === "approved" ? "#ffffff" : "#475569",
            }}
            onClick={() => setActiveTab("approved")}
          >
            PTO / Approved ({stats.approvedCount})
          </button>
          {stats.actionRequiredCount > 0 && (
            <button
              style={{
                ...styles.tabPill,
                background: activeTab === "action_required" ? "#ef4444" : "#f1f5f9",
                color: activeTab === "action_required" ? "#ffffff" : "#b91c1c",
              }}
              onClick={() => setActiveTab("action_required")}
            >
              Action Required ({stats.actionRequiredCount})
            </button>
          )}
        </div>

        {/* Search & Selectors */}
        <div style={styles.filterControls}>
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search project, contractor, app #, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                <FaTimes />
              </button>
            )}
          </div>

          {/* Filter by Invoice Status (Relation between Invoices and Interconnections) */}
          <div style={styles.dropdownContainer}>
            <FaFileInvoiceDollar style={{ color: "#ff6e00", fontSize: "12px" }} />
            <select
              value={selectedInvoiceFilter}
              onChange={(e) => setSelectedInvoiceFilter(e.target.value)}
              style={styles.filterSelect}
              title="Filter by Invoicing Status from Invoices module"
            >
              <option value="all">All Invoice Statuses</option>
              <option value="invoiced">Invoiced / Paid</option>
              <option value="not_invoiced">Not Invoiced</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div style={styles.dropdownContainer}>
            <FaFilter style={{ color: "#64748b", fontSize: "12px" }} />
            <select
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Contractors</option>
              {contractors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.dropdownContainer}>
            <FaBolt style={{ color: "#0284c7", fontSize: "12px" }} />
            <select
              value={selectedUtility}
              onChange={(e) => setSelectedUtility(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Utilities</option>
              {availableUtilities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. TABLE SECTION */}
      <div style={styles.tableCard}>
        {isLoading ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>Loading interconnection data...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={styles.empty}>
            <FaNetworkWired style={{ fontSize: "40px", color: "#cbd5e1", marginBottom: "12px" }} />
            <p style={styles.emptyText}>No projects match the selected filters</p>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
              Try adjusting your search terms, contractor selection, invoice filter, or tab.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>Project</th>
                  <th style={styles.th}>
                    <FaMapMarkerAlt style={{ color: "#ef4444", fontSize: "11px", marginRight: "4px" }} />
                    Address
                  </th>
                  <th style={styles.th}>Contractor</th>
                  <th style={styles.th}>Utility Operator</th>
                  <th style={styles.th}>Interconnection Status</th>
                  <th style={styles.th} title="Linked to Invoices module">
                    <FaFileInvoiceDollar style={{ marginRight: "4px", color: "#ff6e00" }} />
                    Invoice Status
                  </th>
                  <th style={styles.th}>Submitted</th>
                  <th style={styles.th}>Grid Fee</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p, idx) => {
                  const status = p.interconnectionStatus || "Not Started";
                  const statusColor = getStatusColor(status);
                  const invStatus = p.invoiceStatus || (p.isInvoiced ? "Invoiced" : "Not Invoiced");

                  return (
                    <tr
                      key={p._id}
                      style={{
                        ...styles.tr,
                        background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                      }}
                    >
                      {/* Project Name */}
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                            {p.name}
                          </span>
                          {onSelectProject && (
                            <button
                              onClick={() => onSelectProject(p._id)}
                              style={styles.openProjectBtn}
                              title="Open Project Details in main view"
                            >
                              <FaExternalLinkAlt style={{ fontSize: "11px" }} />
                            </button>
                          )}
                        </div>
                        {p.interconnectionNotes && (
                          <div style={styles.notesSnippet} title={p.interconnectionNotes}>
                            📝 {p.interconnectionNotes}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td style={styles.td}>
                        {getProjectAddress(p) ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#334155",
                              maxWidth: "200px",
                            }}
                            title={getProjectAddress(p)}
                          >
                            <FaMapMarkerAlt style={{ color: "#ef4444", fontSize: "11px", flexShrink: 0 }} />
                            <span
                              style={{
                                fontSize: "12.5px",
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getProjectAddress(p)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12.5px" }}>—</span>
                        )}
                      </td>

                      {/* Contractor */}
                      <td style={styles.td}>
                        {p.contractor?.nom ? (
                          <span style={styles.contractorBadge}>
                            <FaBuilding style={{ fontSize: "10px", marginRight: "4px" }} />
                            {p.contractor.nom}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                        )}
                      </td>

                      {/* Utility Operator */}
                      <td style={styles.td}>
                        {p.utilityProvider ? (
                          <span style={styles.utilityBadge}>
                            <FaBolt style={{ fontSize: "10px", marginRight: "4px", color: "#0284c7" }} />
                            {p.utilityProvider}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>Not specified</span>
                        )}
                      </td>

                      {/* Quick Interconnection Status Dropdown */}
                      <td style={styles.td}>
                        <select
                          value={status}
                          onChange={(e) => handleQuickStatusChange(p, e.target.value)}
                          style={{
                            ...styles.statusSelect,
                            background: statusColor.bg,
                            color: statusColor.text,
                            borderColor: statusColor.border,
                          }}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="Documents Gathering">Documents Gathering</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="PTO Granted">PTO Granted</option>
                          <option value="Action Required">Action Required</option>
                        </select>
                      </td>

                      {/* Invoice Status (Direct Relation to Invoices Module) */}
                      <td style={styles.td}>
                        <select
                          value={invStatus}
                          onChange={(e) => handleQuickInvoiceChange(p, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "16px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            outline: "none",
                            border: "1.5px solid",
                            background:
                              invStatus === "Paid"
                                ? "#ecfdf5"
                                : invStatus === "Invoiced"
                                ? "#eff6ff"
                                : invStatus === "Pending"
                                ? "#f5f3ff"
                                : "#fffbeb",
                            color:
                              invStatus === "Paid"
                                ? "#065f46"
                                : invStatus === "Invoiced"
                                ? "#1d4ed8"
                                : invStatus === "Pending"
                                ? "#6d28d9"
                                : "#b45309",
                            borderColor:
                              invStatus === "Paid"
                                ? "#a7f3d0"
                                : invStatus === "Invoiced"
                                ? "#bfdbfe"
                                : invStatus === "Pending"
                                ? "#ddd6fe"
                                : "#fde68a",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                          }}
                          title="Direct link with Invoices module - click to update invoice status"
                        >
                          <option value="Not Invoiced">Not Invoiced</option>
                          <option value="Invoiced">Invoiced</option>
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </td>

                      {/* Submission Date */}
                      <td style={styles.td}>
                        {p.interconnectionSubmissionDate ? (
                          <span style={{ fontSize: "13px", color: "#334155" }}>
                            {p.interconnectionSubmissionDate}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                        )}
                      </td>

                      {/* Fee */}
                      <td style={styles.td}>
                        <span style={{ fontWeight: 600, color: "#0f172a", fontSize: "13.5px" }}>
                          ${(p.interconnectionFee || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          style={styles.editBtn}
                          title="Edit interconnection details"
                        >
                          <FaEdit style={{ marginRight: "4px" }} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. EDIT MODAL */}
      {editingProject && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ ...styles.headerIconBadge, width: "36px", height: "36px" }}>
                  <FaNetworkWired style={{ color: "#0284c7", fontSize: "18px" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                    Edit Interconnection Details
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Project: <strong>{editingProject.name}</strong>
                    {getProjectAddress(editingProject) && (
                      <span style={{ marginLeft: "8px", color: "#475569", fontWeight: 500 }}>
                        • 📍 {getProjectAddress(editingProject)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                style={styles.closeModalBtn}
                title="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Billing / Invoices Relation Box */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <FaFileInvoiceDollar style={{ color: "#ff6e00", fontSize: "15px" }} />
                  <label style={{ ...styles.inputLabel, margin: 0, fontSize: "13.5px", color: "#0f172a" }}>
                    Invoice & Billing Relation (Invoices Module)
                  </label>
                </div>
                <div style={styles.gridTwoCols}>
                  <div>
                    <label style={{ ...styles.inputLabel, fontSize: "12px" }}>Invoice Status</label>
                    <select
                      value={formInvoiceStatus}
                      onChange={(e) => setFormInvoiceStatus(e.target.value)}
                      style={styles.selectInput}
                    >
                      <option value="Not Invoiced">Not Invoiced</option>
                      <option value="Invoiced">Invoiced</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ ...styles.inputLabel, fontSize: "12px" }}>Billing State</label>
                    <div style={{ display: "flex", alignItems: "center", height: "42px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          background:
                            formInvoiceStatus === "Paid"
                              ? "#ecfdf5"
                              : formInvoiceStatus === "Invoiced"
                              ? "#eff6ff"
                              : "#fffbeb",
                          color:
                            formInvoiceStatus === "Paid"
                              ? "#065f46"
                              : formInvoiceStatus === "Invoiced"
                              ? "#1d4ed8"
                              : "#b45309",
                          border: "1px solid",
                          borderColor:
                            formInvoiceStatus === "Paid"
                              ? "#a7f3d0"
                              : formInvoiceStatus === "Invoiced"
                              ? "#bfdbfe"
                              : "#fde68a",
                        }}
                      >
                        {formInvoiceStatus === "Invoiced" || formInvoiceStatus === "Paid"
                          ? "✓ Invoiced"
                          : "✕ Not Invoiced"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.gridTwoCols}>
                {/* Status */}
                <div>
                  <label style={styles.inputLabel}>Interconnection Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={styles.selectInput}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="Documents Gathering">Documents Gathering</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="PTO Granted">PTO Granted</option>
                    <option value="Action Required">Action Required</option>
                  </select>
                </div>

                {/* Utility Provider */}
                <div>
                  <label style={styles.inputLabel}>Utility / Grid Operator</label>
                  <input
                    type="text"
                    placeholder="e.g. Enedis, EDF OA, PG&E, SCE..."
                    value={formUtility}
                    onChange={(e) => setFormUtility(e.target.value)}
                    style={styles.textInput}
                    list="utilities-list"
                  />
                  <datalist id="utilities-list">
                    <option value="Enedis" />
                    <option value="EDF OA" />
                    <option value="PG&E" />
                    <option value="SCE" />
                    <option value="SDG&E" />
                    <option value="National Grid" />
                    <option value="ConEd" />
                    <option value="FPL" />
                  </datalist>
                </div>
              </div>

              <div style={styles.gridTwoCols}>
                {/* Application Number */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ ...styles.inputLabel, margin: 0 }}>Application / Case ID</label>
                    <button
                      type="button"
                      onClick={handleGenerateAppNumber}
                      style={styles.generateBtn}
                    >
                      Generate ID
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. INT-2026-1042"
                    value={formAppNumber}
                    onChange={(e) => setFormAppNumber(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                {/* Grid Fee */}
                <div>
                  <label style={styles.inputLabel}>Interconnection Fee ($ / €)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              <div style={styles.gridTwoCols}>
                {/* Submission Date */}
                <div>
                  <label style={styles.inputLabel}>Submission Date</label>
                  <input
                    type="date"
                    value={formSubmissionDate}
                    onChange={(e) => setFormSubmissionDate(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                {/* Approval Date */}
                <div>
                  <label style={styles.inputLabel}>Approval / PTO Date</label>
                  <input
                    type="date"
                    value={formApprovalDate}
                    onChange={(e) => setFormApprovalDate(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              {/* PTO Status */}
              <div>
                <label style={styles.inputLabel}>PTO Status (Permission to Operate)</label>
                <select
                  value={formPtoStatus}
                  onChange={(e) => setFormPtoStatus(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="Pending">Pending</option>
                  <option value="Granted">Granted</option>
                  <option value="Not Applicable">Not Applicable</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={styles.inputLabel}>Notes & Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Additional notes about utility review, meter installation, requirements..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={styles.textareaInput}
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => setEditingProject(null)}
                style={styles.cancelBtn}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInterconnection}
                style={styles.saveBtn}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Interconnection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers for badges & styles
function getStatusColor(status: string) {
  switch (status) {
    case "PTO Granted":
      return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
    case "Approved":
      return { bg: "#f0fdf4", text: "#166534", border: "#bbf7d0" };
    case "Under Review":
      return { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe" };
    case "Submitted":
      return { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" };
    case "Documents Gathering":
      return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" };
    case "Action Required":
      return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
    case "Not Started":
    default:
      return { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };
  }
}

const styles: Record<string, React.CSSProperties> = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerIconBadge: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13.5px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.25)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
  },
  statIconContainer: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: 600,
    color: "#64748b",
    marginTop: "2px",
  },
  filterSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "20px",
  },
  tabPillsContainer: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  tabPill: {
    border: "none",
    borderRadius: "20px",
    padding: "7px 14px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  filterControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  searchContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    color: "#94a3b8",
    fontSize: "13px",
  },
  searchInput: {
    padding: "8px 32px 8px 34px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13.5px",
    color: "#0f172a",
    outline: "none",
    width: "220px",
  },
  clearSearchBtn: {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: 0,
  },
  dropdownContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#ffffff",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    padding: "0 10px",
  },
  filterSelect: {
    border: "none",
    outline: "none",
    padding: "8px 0",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    background: "transparent",
    cursor: "pointer",
  },
  tableCard: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  theadRow: {
    background: "#f8fafc",
    borderBottom: "1.5px solid #e2e8f0",
  },
  th: {
    padding: "12px 14px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s ease",
  },
  td: {
    padding: "12px 14px",
    fontSize: "13.5px",
    verticalAlign: "middle",
  },
  openProjectBtn: {
    background: "none",
    border: "none",
    color: "#0284c7",
    cursor: "pointer",
    padding: "2px",
    display: "inline-flex",
  },
  notesSnippet: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "3px",
    maxWidth: "220px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  contractorBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f1f5f9",
    color: "#334155",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: 600,
  },
  utilityBadge: {
    display: "inline-flex",
    alignItems: "center",
    background: "#f0f9ff",
    color: "#0369a1",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: 600,
    border: "1px solid #e0f2fe",
  },
  appNumBadge: {
    display: "inline-block",
    fontFamily: "monospace",
    fontSize: "12.5px",
    fontWeight: 700,
    color: "#0f172a",
    background: "#f8fafc",
    padding: "3px 6px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  statusSelect: {
    padding: "4px 8px",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: 700,
    border: "1px solid",
    cursor: "pointer",
    outline: "none",
  },
  editBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    background: "#f8fafc",
    border: "1.5px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "12.5px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
  },
  empty: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1e3c72",
    margin: 0,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalCard: {
    background: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "560px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    borderBottom: "1.5px solid #f1f5f9",
  },
  closeModalBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px",
  },
  modalBody: {
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  gridTwoCols: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
  },
  inputLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "6px",
  },
  selectInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
    boxSizing: "border-box",
  },
  textInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
    boxSizing: "border-box",
  },
  textareaInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13.5px",
    color: "#0f172a",
    background: "#ffffff",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "inherit",
  },
  generateBtn: {
    background: "none",
    border: "none",
    color: "#0284c7",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    borderTop: "1.5px solid #f1f5f9",
    background: "#f8fafc",
    borderBottomLeftRadius: "16px",
    borderBottomRightRadius: "16px",
  },
  cancelBtn: {
    padding: "10px 18px",
    background: "#ffffff",
    color: "#475569",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 22px",
    background: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
  },
};
