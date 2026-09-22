import React, { useState, useEffect, useMemo } from "react";
import {
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaHourglassHalf,
  FaDollarSign,
  FaSearch,
  FaEdit,
  FaExternalLinkAlt,
  FaTimes,
  FaFilter,
  FaDownload,
  FaClock,
  FaBuilding,
  FaChartPie,
} from "react-icons/fa";
import {
  getProjects,
  getContractors,
  updateProjectInvoice,
  type Project,
  type Contractor,
} from "../../lib/api";

interface InvoicesProps {
  onSelectProject?: (projectId: string) => void;
}

export default function Invoices({ onSelectProject }: InvoicesProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [activeTab, setActiveTab] = useState<"all" | "not_invoiced" | "invoiced" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedContractorId, setSelectedContractorId] = useState<string>("all");

  // Edit Modal State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formIsInvoiced, setFormIsInvoiced] = useState<boolean>(false);
  const [formInvoiceStatus, setFormInvoiceStatus] = useState<string>("Not Invoiced");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState<string>("");
  const [formInvoiceDate, setFormInvoiceDate] = useState<string>("");
  const [formInvoiceAmount, setFormInvoiceAmount] = useState<string>("");
  const [formInvoiceNotes, setFormInvoiceNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load Projects & Contractors
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projs, conts] = await Promise.all([getProjects(), getContractors()]);
      setProjects(projs || []);
      setContractors(conts || []);
    } catch (err: any) {
      console.error("Error loading invoices data:", err);
      alert(err.message || "Failed to load projects data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit Invoice Modal
  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormIsInvoiced(Boolean(project.isInvoiced));
    setFormInvoiceStatus(project.invoiceStatus || (project.isInvoiced ? "Invoiced" : "Not Invoiced"));
    setFormInvoiceNumber(project.invoiceNumber || "");
    setFormInvoiceDate(project.invoiceDate || new Date().toISOString().slice(0, 10));
    setFormInvoiceAmount(project.invoiceAmount !== undefined && project.invoiceAmount !== null ? String(project.invoiceAmount) : "");
    setFormInvoiceNotes(project.invoiceNotes || "");
  };

  // Quick Status Change directly from the table
  const handleQuickStatusChange = async (project: Project, newStatus: string) => {
    const isInvoiced = newStatus === "Invoiced" || newStatus === "Paid";
    const today = new Date().toISOString().slice(0, 10);

    try {
      const updated = await updateProjectInvoice(project._id, {
        isInvoiced,
        invoiceStatus: newStatus,
        invoiceDate: isInvoiced && !project.invoiceDate ? today : project.invoiceDate,
      });

      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, ...updated } : p))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update invoice status");
    }
  };

  // Generate Suggested Invoice Number
  const handleGenerateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormInvoiceNumber(`INV-${year}-${rand}`);
  };

  // Save Modal
  const handleSaveInvoice = async () => {
    if (!editingProject) return;

    setIsSaving(true);
    try {
      const amountNum = formInvoiceAmount.trim() ? parseFloat(formInvoiceAmount) : 0;
      const updated = await updateProjectInvoice(editingProject._id, {
        isInvoiced: formIsInvoiced,
        invoiceStatus: formInvoiceStatus,
        invoiceNumber: formInvoiceNumber.trim(),
        invoiceDate: formInvoiceDate,
        invoiceAmount: isNaN(amountNum) ? 0 : amountNum,
        invoiceNotes: formInvoiceNotes.trim(),
      });

      setProjects((prev) =>
        prev.map((p) => (p._id === editingProject._id ? { ...p, ...updated } : p))
      );
      setEditingProject(null);
    } catch (err: any) {
      alert(err.message || "Failed to save invoice details");
    } finally {
      setIsSaving(false);
    }
  };

  // Export Invoices CSV
  const handleExportCSV = () => {
    const headers = [
      "Project Name",
      "Contractor",
      "Project Status",
      "Invoiced (Yes/No)",
      "Invoice Status",
      "Invoice Number",
      "Invoice Date",
      "Invoice Amount ($)",
      "Invoice Notes",
    ];

    const rows = filteredProjects.map((p) => [
      `"${(p.name || "").replace(/"/g, '""')}"`,
      `"${(p.contractor?.nom || "Unassigned").replace(/"/g, '""')}"`,
      `"${(p.status || "").replace(/"/g, '""')}"`,
      p.isInvoiced ? "Yes" : "No",
      `"${p.invoiceStatus || (p.isInvoiced ? "Invoiced" : "Not Invoiced")}"`,
      `"${p.invoiceNumber || ""}"`,
      `"${p.invoiceDate || ""}"`,
      p.invoiceAmount || 0,
      `"${(p.invoiceNotes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = projects.length;
    const invoicedCount = projects.filter((p) => p.isInvoiced || p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid").length;
    const notInvoicedCount = total - invoicedCount;
    const paidCount = projects.filter((p) => p.invoiceStatus === "Paid").length;
    const notPaidCount = total - paidCount;

    const paidAmount = projects
      .filter((p) => p.invoiceStatus === "Paid")
      .reduce((sum, p) => sum + (Number(p.invoiceAmount) || 0), 0);

    const unpaidAmount = projects
      .filter((p) => (p.isInvoiced || p.invoiceStatus === "Invoiced") && p.invoiceStatus !== "Paid")
      .reduce((sum, p) => sum + (Number(p.invoiceAmount) || 0), 0);

    const totalAmount = projects
      .filter((p) => p.isInvoiced || p.invoiceStatus === "Paid" || p.invoiceStatus === "Invoiced")
      .reduce((sum, p) => sum + (Number(p.invoiceAmount) || 0), 0);

    const invoicedRate = total > 0 ? Math.round((invoicedCount / total) * 100) : 0;
    const notInvoicedRate = total > 0 ? 100 - invoicedRate : 0;
    const paidRate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
    const notPaidRate = total > 0 ? 100 - paidRate : 0;

    return {
      total,
      invoicedCount,
      notInvoicedCount,
      paidCount,
      notPaidCount,
      paidAmount,
      unpaidAmount,
      totalAmount,
      invoicedRate,
      notInvoicedRate,
      paidRate,
      notPaidRate,
    };
  }, [projects]);

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Tab filter
      const isInvoiced = Boolean(p.isInvoiced || p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid");
      if (activeTab === "not_invoiced" && isInvoiced) return false;
      if (activeTab === "invoiced" && (!isInvoiced || p.invoiceStatus === "Paid")) return false;
      if (activeTab === "paid" && p.invoiceStatus !== "Paid") return false;

      // Contractor filter
      if (selectedContractorId !== "all") {
        if (!p.contractor || p.contractor._id !== selectedContractorId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesContractor = p.contractor?.nom?.toLowerCase().includes(q);
        const matchesInvNum = p.invoiceNumber?.toLowerCase().includes(q);
        const matchesStatus = p.status?.toLowerCase().includes(q);
        if (!matchesName && !matchesContractor && !matchesInvNum && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [projects, activeTab, selectedContractorId, searchQuery]);

  return (
    <div className="admin-projects-section" style={{ border: "1.5px solid #eef2f6", padding: "24px" }}>
      {/* 1. HEADER & ACTIONS */}
      <div style={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={styles.headerIconBadge}>
            <FaFileInvoiceDollar style={{ fontSize: "22px", color: "#ff6e00" }} />
          </div>
          <div>
            <h2 className="admin-main-title" style={{ fontSize: "clamp(22px, 3.5vw, 28px)", margin: 0 }}>
              Invoices & Billing
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
              Track whether projects have been invoiced, monitor billing statuses and payment records.
            </p>
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
            borderColor: activeTab === "all" ? "#ff6e00" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("all")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(255, 110, 0, 0.12)", color: "#ff6e00" }}>
            <FaFileInvoiceDollar />
          </div>
          <div>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Projects</div>
          </div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "not_invoiced" ? "#f59e0b" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("not_invoiced")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(245, 158, 11, 0.12)", color: "#d97706" }}>
            <FaHourglassHalf />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#d97706" }}>{stats.notInvoicedCount}</div>
            <div style={styles.statLabel}>Pending Invoicing</div>
          </div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeTab === "invoiced" ? "#10b981" : "#e2e8f0",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("invoiced")}
        >
          <div style={{ ...styles.statIconContainer, background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <FaCheckCircle />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#059669" }}>
              {stats.invoicedCount} <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>({stats.invoicedRate}%)</span>
            </div>
            <div style={styles.statLabel}>Invoiced Projects</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconContainer, background: "rgba(59, 130, 246, 0.12)", color: "#2563eb" }}>
            <FaDollarSign />
          </div>
          <div>
            <div style={{ ...styles.statValue, color: "#0f172a" }}>
              ${stats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={styles.statLabel}>Total Invoiced Amount</div>
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
            All Projects ({stats.total})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "not_invoiced" ? "#d97706" : "#fef3c7",
              color: activeTab === "not_invoiced" ? "#ffffff" : "#92400e",
            }}
            onClick={() => setActiveTab("not_invoiced")}
          >
            Pending Invoicing ({stats.notInvoicedCount})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "invoiced" ? "#059669" : "#d1fae5",
              color: activeTab === "invoiced" ? "#ffffff" : "#065f46",
            }}
            onClick={() => setActiveTab("invoiced")}
          >
            Invoiced ({stats.invoicedCount})
          </button>
          <button
            style={{
              ...styles.tabPill,
              background: activeTab === "paid" ? "#2563eb" : "#dbeafe",
              color: activeTab === "paid" ? "#ffffff" : "#1e40af",
            }}
            onClick={() => setActiveTab("paid")}
          >
            Paid ({stats.paidCount})
          </button>
        </div>

        {/* Search & Contractor Dropdown */}
        <div style={styles.searchDropdownRow}>
          <div style={styles.searchContainer}>
            <FaSearch style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search project, contractor, invoice #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => setSearchQuery("")}>
                ✕
              </button>
            )}
          </div>

          <div style={styles.dropdownContainer}>
            <FaFilter style={styles.dropdownIcon} />
            <select
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              style={styles.contractorSelect}
            >
              <option value="all">All Contractors</option>
              {contractors.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. INVOICES TABLE */}
      {isLoading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Loading invoices & projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: "42px", marginBottom: "12px" }}>🧾</div>
          <p style={styles.emptyText}>No matching projects found</p>
          <p style={{ color: "#64748b", fontSize: "14px", marginTop: "6px" }}>
            Try adjusting your search criteria or filter tabs above.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>Contractor</th>
                <th style={styles.th}>Project Status</th>
                <th style={styles.th}>Invoice Status</th>
                <th style={styles.th}>Invoice #</th>
                <th style={styles.th}>Invoice Date</th>
                <th style={styles.th}>Amount ($)</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => {
                const isInvoiced = Boolean(p.isInvoiced || p.invoiceStatus === "Invoiced" || p.invoiceStatus === "Paid");
                const amount = Number(p.invoiceAmount) || 0;

                return (
                  <tr key={p._id} style={styles.tr}>
                    {/* Project Name */}
                    <td style={{ ...styles.td, fontWeight: 700, color: "#0f172a" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isInvoiced ? "#10b981" : "#f59e0b",
                            flexShrink: 0,
                          }}
                        ></span>
                        <span style={{ fontSize: "14px" }}>{p.name}</span>
                      </div>
                      {p.serviceType && (
                        <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "2px", fontWeight: 400 }}>
                          {p.serviceType}
                        </div>
                      )}
                    </td>

                    {/* Contractor */}
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#334155" }}>
                        <FaBuilding style={{ color: "#94a3b8", fontSize: "11px" }} />
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>
                          {p.contractor?.nom || <span style={{ color: "#94a3b8" }}>Unassigned</span>}
                        </span>
                      </div>
                    </td>

                    {/* Project Status */}
                    <td style={styles.td}>
                      <span style={styles.projectStatusPill}>{p.status || "In Discovery"}</span>
                    </td>

                    {/* Invoiced Status Dropdown Selector */}
                    <td style={styles.td}>
                      <select
                        value={p.invoiceStatus || (p.isInvoiced ? "Invoiced" : "Not Invoiced")}
                        onChange={(e) => handleQuickStatusChange(p, e.target.value)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          outline: "none",
                          border: "1.5px solid",
                          background:
                            p.invoiceStatus === "Paid"
                              ? "#ecfdf5"
                              : (p.isInvoiced || p.invoiceStatus === "Invoiced")
                              ? "#eff6ff"
                              : "#fffbeb",
                          color:
                            p.invoiceStatus === "Paid"
                              ? "#065f46"
                              : (p.isInvoiced || p.invoiceStatus === "Invoiced")
                              ? "#1d4ed8"
                              : "#b45309",
                          borderColor:
                            p.invoiceStatus === "Paid"
                              ? "#a7f3d0"
                              : (p.isInvoiced || p.invoiceStatus === "Invoiced")
                              ? "#bfdbfe"
                              : "#fde68a",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                        title="Change billing status: Not Invoiced / Invoiced / Paid"
                      >
                        <option value="Not Invoiced">⏳ Not Invoiced</option>
                        <option value="Invoiced">🧾 Invoiced</option>
                        <option value="Paid">✅ Paid</option>
                      </select>
                    </td>

                    {/* Invoice Number */}
                    <td style={styles.td}>
                      {p.invoiceNumber ? (
                        <span style={styles.invoiceNumberPill}>{p.invoiceNumber}</span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                      )}
                    </td>

                    {/* Invoice Date */}
                    <td style={styles.td}>
                      {p.invoiceDate ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px", color: "#334155" }}>
                          <FaClock style={{ color: "#94a3b8", fontSize: "11px" }} />
                          <span>{p.invoiceDate}</span>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={styles.td}>
                      {amount > 0 ? (
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "13.5px" }}>
                          ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>$0.00</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      <div style={styles.tableActions}>
                        {/* Edit Invoice Button */}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          style={styles.editInvoiceBtn}
                          title="Edit invoice details (number, amount, date)"
                        >
                          <FaEdit />
                          <span>Edit</span>
                        </button>

                        {/* Open in Dashboard Button */}
                        {onSelectProject && (
                          <button
                            onClick={() => onSelectProject(p._id)}
                            style={styles.openProjectBtn}
                            title="View project details in dashboard"
                          >
                            <FaExternalLinkAlt style={{ fontSize: "10px" }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. BOTTOM INVOICE & PAYMENT STATISTICS */}
      <div style={styles.bottomStatsCard}>
        <div style={styles.bottomStatsHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={styles.bottomStatsIconBadge}>
              <FaChartPie style={{ color: "#2563eb", fontSize: "18px" }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0f172a" }}>
                Invoices & Payment Statistics Summary
              </h3>
              <p style={{ margin: "3px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                Overall project portfolio breakdown: Invoiced vs Not Invoiced &amp; Paid vs Not Paid
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {filteredProjects.length !== stats.total && (
              <span style={{ fontSize: "12px", color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "14px" }}>
                Filtered view: <strong>{filteredProjects.length}</strong> / {stats.total}
              </span>
            )}
            <span style={{ fontSize: "12.5px", color: "#1e293b", background: "#f1f5f9", padding: "5px 12px", borderRadius: "14px", fontWeight: 700 }}>
              Total Portfolio: {stats.total} Projects
            </span>
          </div>
        </div>

        {/* 2 Big Comparison Panels Grid */}
        <div style={styles.bottomStatsGrid}>
          {/* Panel 1: INVOICED VS NOT INVOICED */}
          <div style={styles.summaryBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>🧾</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  Invoiced vs Not Invoiced
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "3px 9px", borderRadius: "12px" }}>
                {stats.invoicedRate}% Invoiced
              </span>
            </div>

            {/* Visual Two-Tone Progress Bar */}
            <div style={{ height: "12px", width: "100%", borderRadius: "6px", background: "#f1f5f9", overflow: "hidden", display: "flex", marginBottom: "16px" }}>
              <div
                style={{
                  width: `${stats.invoicedRate}%`,
                  background: "#16a34a",
                  transition: "width 0.4s ease",
                }}
                title={`Invoiced: ${stats.invoicedCount} (${stats.invoicedRate}%)`}
              />
              <div
                style={{
                  width: `${stats.notInvoicedRate}%`,
                  background: "#f59e0b",
                  transition: "width 0.4s ease",
                }}
                title={`Not Invoiced: ${stats.notInvoicedCount} (${stats.notInvoicedRate}%)`}
              />
            </div>

            {/* 2 Stat Sub-boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Invoiced */}
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <FaCheckCircle style={{ color: "#16a34a", fontSize: "13px" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#166534" }}>Invoiced</span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#14532d" }}>
                  {stats.invoicedCount}
                </div>
                <div style={{ fontSize: "11.5px", color: "#15803d", marginTop: "2px", fontWeight: 600 }}>
                  {stats.invoicedRate}% of all projects
                </div>
              </div>

              {/* Not Invoiced */}
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <FaHourglassHalf style={{ color: "#d97706", fontSize: "13px" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>Not Invoiced</span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#78350f" }}>
                  {stats.notInvoicedCount}
                </div>
                <div style={{ fontSize: "11.5px", color: "#b45309", marginTop: "2px", fontWeight: 600 }}>
                  {stats.notInvoicedRate}% pending invoice
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: PAID VS NOT PAID */}
          <div style={styles.summaryBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "16px" }}>💳</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                  Paid vs Not Paid
                </span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 9px", borderRadius: "12px" }}>
                {stats.paidRate}% Paid
              </span>
            </div>

            {/* Visual Two-Tone Progress Bar */}
            <div style={{ height: "12px", width: "100%", borderRadius: "6px", background: "#f1f5f9", overflow: "hidden", display: "flex", marginBottom: "16px" }}>
              <div
                style={{
                  width: `${stats.paidRate}%`,
                  background: "#059669",
                  transition: "width 0.4s ease",
                }}
                title={`Paid: ${stats.paidCount} (${stats.paidRate}%)`}
              />
              <div
                style={{
                  width: `${stats.notPaidRate}%`,
                  background: "#f43f5e",
                  transition: "width 0.4s ease",
                }}
                title={`Not Paid: ${stats.notPaidCount} (${stats.notPaidRate}%)`}
              />
            </div>

            {/* 2 Stat Sub-boxes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* Paid */}
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <FaCheckCircle style={{ color: "#059669", fontSize: "13px" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#065f46" }}>Paid</span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#064e3b" }}>
                  {stats.paidCount}
                </div>
                <div style={{ fontSize: "11.5px", color: "#047857", marginTop: "2px", fontWeight: 600 }}>
                  {stats.paidRate}% • ${stats.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Not Paid */}
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <FaClock style={{ color: "#e11d48", fontSize: "13px" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#9f1239" }}>Not Paid</span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#881337" }}>
                  {stats.notPaidCount}
                </div>
                <div style={{ fontSize: "11.5px", color: "#be123c", marginTop: "2px", fontWeight: 600 }}>
                  {stats.notPaidRate}% • ${stats.unpaidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pending
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Horizontal Ratio Footer Strip */}
        <div style={styles.bottomQuickStrip}>
          <div style={styles.bottomQuickItem}>
            <span style={{ color: "#64748b" }}>📁 Total Projects:</span>
            <strong>{stats.total}</strong>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }}></div>
          <div style={styles.bottomQuickItem}>
            <span style={{ color: "#166534" }}>✅ Invoiced:</span>
            <strong style={{ color: "#166534" }}>{stats.invoicedCount} ({stats.invoicedRate}%)</strong>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }}></div>
          <div style={styles.bottomQuickItem}>
            <span style={{ color: "#b45309" }}>⏳ Not Invoiced:</span>
            <strong style={{ color: "#b45309" }}>{stats.notInvoicedCount} ({stats.notInvoicedRate}%)</strong>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }}></div>
          <div style={styles.bottomQuickItem}>
            <span style={{ color: "#065f46" }}>💳 Paid:</span>
            <strong style={{ color: "#065f46" }}>{stats.paidCount} ({stats.paidRate}%)</strong>
          </div>
          <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }}></div>
          <div style={styles.bottomQuickItem}>
            <span style={{ color: "#9f1239" }}>🕒 Not Paid:</span>
            <strong style={{ color: "#9f1239" }}>{stats.notPaidCount} ({stats.notPaidRate}%)</strong>
          </div>
        </div>
      </div>

      {/* 5. EDIT INVOICE MODAL */}
      {editingProject && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "520px" }}>
            <div style={styles.formHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={styles.modalIconBadge}>
                  <FaFileInvoiceDollar style={{ color: "#ff6e00", fontSize: "18px" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: 800 }}>
                    Edit Invoice Details
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
                    {editingProject.name}
                  </p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setEditingProject(null)}>
                <FaTimes />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "4px 0 16px 0" }}>
              {/* Invoiced Toggle Switch */}
              <div style={styles.toggleRow}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                    Invoiced Status
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Has this project been billed to the contractor/client?
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: formIsInvoiced ? "#16a34a" : "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {formIsInvoiced ? "Invoiced" : "Pending"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formIsInvoiced}
                    onClick={() => {
                      const nextVal = !formIsInvoiced;
                      setFormIsInvoiced(nextVal);
                      if (nextVal && formInvoiceStatus === "Not Invoiced") {
                        setFormInvoiceStatus("Invoiced");
                      } else if (!nextVal) {
                        setFormInvoiceStatus("Not Invoiced");
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "48px",
                      height: "26px",
                      borderRadius: "13px",
                      background: formIsInvoiced ? "#16a34a" : "#cbd5e1",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "background 0.2s ease",
                      outline: "none",
                      flexShrink: 0,
                    }}
                    title={formIsInvoiced ? "Mark as Not Invoiced" : "Mark as Invoiced"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: formIsInvoiced ? "25px" : "3px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                        transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label style={styles.inputLabel}>Invoice Status</label>
                <select
                  value={formInvoiceStatus}
                  onChange={(e) => {
                    setFormInvoiceStatus(e.target.value);
                    if (e.target.value === "Not Invoiced") {
                      setFormIsInvoiced(false);
                    } else {
                      setFormIsInvoiced(true);
                    }
                  }}
                  style={styles.selectInput}
                >
                  <option value="Not Invoiced">Not Invoiced</option>
                  <option value="Invoiced">Invoiced</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>

              {/* Invoice Number with Auto-generate */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ ...styles.inputLabel, margin: 0 }}>
                    Invoice Number <span style={{ fontWeight: 400, color: "#64748b", fontSize: "11.5px" }}>(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateInvoiceNumber}
                    style={styles.generateBtn}
                  >
                    Auto-generate #
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. INV-2026-1045 (optional)"
                  value={formInvoiceNumber}
                  onChange={(e) => setFormInvoiceNumber(e.target.value)}
                  style={styles.textInput}
                />
              </div>

              {/* Amount & Date Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={styles.inputLabel}>
                    Invoice Amount ($) <span style={{ fontWeight: 400, color: "#64748b", fontSize: "11.5px" }}>(Optional)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formInvoiceAmount}
                    onChange={(e) => setFormInvoiceAmount(e.target.value)}
                    style={styles.textInput}
                  />
                </div>

                <div>
                  <label style={styles.inputLabel}>
                    Invoice Date <span style={{ fontWeight: 400, color: "#64748b", fontSize: "11.5px" }}>(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formInvoiceDate}
                    onChange={(e) => setFormInvoiceDate(e.target.value)}
                    style={styles.textInput}
                  />
                </div>
              </div>

              {/* Invoice Notes */}
              <div>
                <label style={styles.inputLabel}>
                  Invoice Notes / Details <span style={{ fontWeight: 400, color: "#64748b", fontSize: "11.5px" }}>(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional billing details, payment terms, or reference notes..."
                  value={formInvoiceNotes}
                  onChange={(e) => setFormInvoiceNotes(e.target.value)}
                  style={styles.textareaInput}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="admin-form-actions">
              <button style={styles.saveBtn} onClick={handleSaveInvoice} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Invoice"}
              </button>
              <button style={styles.cancelBtn} onClick={() => setEditingProject(null)}>
                Cancel
              </button>
            </div>
          </div>
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
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "rgba(255, 110, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "9px 14px",
    background: "#ffffff",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    transition: "all 0.15s ease",
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
    transition: "all 0.15s ease",
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

  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "18px",
  },

  tabPillsContainer: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  tabPill: {
    padding: "7px 14px",
    borderRadius: "20px",
    border: "none",
    fontSize: "12.5px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  searchDropdownRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  searchContainer: {
    position: "relative",
    flex: 1,
    minWidth: "260px",
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
  },

  clearBtn: {
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

  dropdownContainer: {
    position: "relative",
    minWidth: "200px",
  },

  dropdownIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "12px",
    pointerEvents: "none",
  },

  contractorSelect: {
    width: "100%",
    padding: "9px 12px 9px 32px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13.5px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    cursor: "pointer",
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

  projectStatusPill: {
    display: "inline-block",
    padding: "3px 9px",
    borderRadius: "10px",
    fontSize: "11.5px",
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
  },

  invoiceToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  invoiceNumberPill: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "#1e293b",
    background: "#f8fafc",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
  },

  tableActions: {
    display: "flex",
    gap: "6px",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  editInvoiceBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 10px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },

  openProjectBtn: {
    width: "28px",
    height: "28px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
  },

  // Modal styles
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  modalIconBadge: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "rgba(255, 110, 0, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },

  switch: {
    position: "relative",
    display: "inline-block",
    width: "44px",
    height: "24px",
  },

  slider: {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#cbd5e1",
    transition: ".2s",
    borderRadius: "24px",
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
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
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

  bottomStatsCard: {
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "14px",
    padding: "20px 24px",
    marginTop: "24px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
  },

  bottomStatsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
    flexWrap: "wrap",
    gap: "12px",
  },

  bottomStatsIconBadge: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  bottomStatsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },

  summaryBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "18px",
  },

  bottomQuickStrip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #e2e8f0",
    fontSize: "13px",
  },

  bottomQuickItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};
