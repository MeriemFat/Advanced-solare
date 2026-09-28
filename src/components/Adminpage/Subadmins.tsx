import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaCrown,
  FaEnvelope,
  FaLock,
  FaUser,
  FaKey,
  FaCheck,
  FaTimes,
  FaLayerGroup,
  FaTasks,
  FaFolderOpen,
} from "react-icons/fa";
import {
  getSubadmins,
  createSubadmin,
  updateSubadmin,
  deleteSubadmin,
  type SubadminUser,
  type UserPermissions,
} from "../../lib/api";

type SubadminsProps = {
  currentUser: { id?: string; name: string; email: string; role?: string } | null;
};

const DEFAULT_PERMISSIONS: UserPermissions = {
  canViewProjects: true,
  canViewContractors: true,
  canViewInvoices: true,
  canViewInterconnection: true,
  projectAccess: "all",
  canCreateProjects: true,
  canEditProjects: true,
  canDeleteProjects: false,
  canExportProjects: true,
  canManageContractors: true,
  canEditInvoices: true,
  canEditInterconnection: true,
};

export default function Subadmins({ currentUser }: SubadminsProps) {
  const [subadmins, setSubadmins] = useState<SubadminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // User form (create/edit info)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "subadmin" as "admin" | "subadmin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permissions modal state
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<SubadminUser | null>(null);
  const [permsForm, setPermsForm] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const loadSubadmins = () => {
    setIsLoading(true);
    getSubadmins()
      .then(setSubadmins)
      .catch((err) => alert(err.message || "Error loading users"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSubadmins();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "subadmin",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Please enter a name and email address!");
      return;
    }

    if (!editingId && !formData.password.trim()) {
      alert("Please enter a password for the new account!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updateData: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
        };
        if (formData.password.trim()) {
          updateData.password = formData.password.trim();
        }
        const res = await updateSubadmin(editingId, updateData);
        setSubadmins(subadmins.map((s) => (s._id === editingId ? res.user : s)));
      } else {
        const res = await createSubadmin({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: formData.role,
          permissions: DEFAULT_PERMISSIONS,
        });
        setSubadmins([res.user, ...subadmins]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "Error saving user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: SubadminUser) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role === "admin" ? "admin" : "subadmin",
    });
    setEditingId(user._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (currentUser?.id === id || currentUser?.email === subadmins.find((s) => s._id === id)?.email) {
      alert("You cannot delete your own administrator account!");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the account for ${name}?`)) {
      return;
    }

    try {
      await deleteSubadmin(id);
      setSubadmins(subadmins.filter((s) => s._id !== id));
    } catch (err: any) {
      alert(err.message || "Error deleting account");
    }
  };

  // Open permissions modal
  const handleOpenPermissions = (user: SubadminUser) => {
    setSelectedUserForPerms(user);
    const existing = user.permissions || DEFAULT_PERMISSIONS;
    setPermsForm({
      ...DEFAULT_PERMISSIONS,
      ...existing,
    });
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!selectedUserForPerms) return;

    setIsSavingPerms(true);
    try {
      const res = await updateSubadmin(selectedUserForPerms._id, {
        permissions: permsForm,
      });

      setSubadmins(
        subadmins.map((s) => (s._id === selectedUserForPerms._id ? res.user : s))
      );
      setSelectedUserForPerms(null);
    } catch (err: any) {
      alert(err.message || "Error updating permissions");
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Apply preset templates
  const applyPreset = (preset: "full" | "pm_drafter" | "readonly") => {
    if (preset === "full") {
      setPermsForm({
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
      });
    } else if (preset === "pm_drafter") {
      setPermsForm({
        canViewProjects: true,
        canViewContractors: false,
        canViewInvoices: false,
        canViewInterconnection: true,
        projectAccess: "assigned",
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: false,
        canExportProjects: true,
        canManageContractors: false,
        canEditInvoices: false,
        canEditInterconnection: true,
      });
    } else if (preset === "readonly") {
      setPermsForm({
        canViewProjects: true,
        canViewContractors: true,
        canViewInvoices: true,
        canViewInterconnection: true,
        projectAccess: "all",
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
        canExportProjects: false,
        canManageContractors: false,
        canEditInvoices: false,
        canEditInterconnection: false,
      });
    }
  };

  const totalAdmins = subadmins.length;
  const superAdminsCount = subadmins.filter((u) => u.role === "admin").length;
  const subAdminsCount = subadmins.filter((u) => u.role === "subadmin").length;

  return (
    <div style={styles.section}>
      {/* HEADER SECTION */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>User Management & Permissions</h2>
          <p style={styles.subtitle}>
            Manage user accounts, project visibility scopes (all vs. assigned), and access permissions across modules.
          </p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          <FaPlus /> New User
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#f3e8ff", color: "#9333ea" }}>
            <FaUserShield style={{ fontSize: "20px" }} />
          </div>
          <div>
            <div style={styles.statNumber}>{totalAdmins}</div>
            <div style={styles.statLabel}>Total Administrators</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#fef3c7", color: "#d97706" }}>
            <FaCrown style={{ fontSize: "20px" }} />
          </div>
          <div>
            <div style={styles.statNumber}>{superAdminsCount}</div>
            <div style={styles.statLabel}>Super Admins (Full Access)</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#e0f2fe", color: "#0284c7" }}>
            <FaUserShield style={{ fontSize: "20px" }} />
          </div>
          <div>
            <div style={styles.statNumber}>{subAdminsCount}</div>
            <div style={styles.statLabel}>Sub-Admins (Custom Permissions)</div>
          </div>
        </div>
      </div>

      {/* MODAL FORM: CREATE / EDIT USER DETAILS */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {editingId ? "✏️ Edit Profile" : "➕ Create User"}
              </h3>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            <div style={styles.formBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <FaUser style={styles.inputIcon} />
                  <input
                    type="text"
                    placeholder="Ex: John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <FaEnvelope style={styles.inputIcon} />
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  {editingId ? "New password (leave blank to keep current)" : "Password"}
                </label>
                <div style={styles.inputWrapper}>
                  <FaLock style={styles.inputIcon} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  style={styles.select}
                >
                  <option value="subadmin">🛡️ Sub-Admin (Permissions configured by Admin)</option>
                  <option value="admin">👑 Super Admin (Full unrestricted access)</option>
                </select>
              </div>

              <div style={styles.formButtons}>
                <button style={styles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingId ? "Update" : "Create Account"}
                </button>
                <button style={styles.cancelBtn} onClick={resetForm} disabled={isSubmitting}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PERMISSIONS: MANAGE ACCESS AND VISIBILITY */}
      {selectedUserForPerms && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.formCard, maxWidth: "680px" }}>
            <div style={{ ...styles.formHeader, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(255,110,0,0.2)", color: "#ff8533", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                  <FaKey />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>
                    Access & Permissions: {selectedUserForPerms.name}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Email: {selectedUserForPerms.email} · Role: {selectedUserForPerms.role}
                  </p>
                </div>
              </div>
              <button style={{ ...styles.closeBtn, color: "#ffffff" }} onClick={() => setSelectedUserForPerms(null)}>✕</button>
            </div>

            <div style={{ ...styles.formBody, maxHeight: "80vh", overflowY: "auto" }}>
              {/* PRESETS BUTTONS */}
              <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ⚡ Quick Presets
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => applyPreset("full")}
                    style={styles.presetBtn}
                  >
                    👑 Full Access
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("pm_drafter")}
                    style={{ ...styles.presetBtn, background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}
                  >
                    🛠️ PM / Drafter (Assigned Only)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("readonly")}
                    style={{ ...styles.presetBtn, background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" }}
                  >
                    👁️ Read-Only
                  </button>
                </div>
              </div>

              {/* SECTION 1: VISIBLE MODULES (TABS) */}
              <div style={styles.permSection}>
                <div style={styles.permSectionHeader}>
                  <FaLayerGroup style={{ color: "#0284c7" }} />
                  <span>1. Visible Modules & Navigation Tabs</span>
                </div>
                <p style={styles.permSectionDesc}>
                  Select which modules appear in the navigation bar for this user.
                </p>

                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canViewProjects}
                      onChange={(e) => setPermsForm({ ...permsForm, canViewProjects: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>📊 Projects</div>
                      <div style={styles.checkboxSubtitle}>Full solar project tracking and management table</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canViewInterconnection}
                      onChange={(e) => setPermsForm({ ...permsForm, canViewInterconnection: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>⚡ Interconnection & PTO</div>
                      <div style={styles.checkboxSubtitle}>Utility grid applications and PTO approvals</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canViewInvoices}
                      onChange={(e) => setPermsForm({ ...permsForm, canViewInvoices: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>💰 Invoices</div>
                      <div style={styles.checkboxSubtitle}>Project billing tracking and invoice statuses</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canViewContractors}
                      onChange={(e) => setPermsForm({ ...permsForm, canViewContractors: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>🏢 Contractors</div>
                      <div style={styles.checkboxSubtitle}>Contractor companies and partner directory</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 2: PROJECT VISIBILITY SCOPE */}
              <div style={styles.permSection}>
                <div style={styles.permSectionHeader}>
                  <FaFolderOpen style={{ color: "#ff6e00" }} />
                  <span>2. Project Visibility Scope</span>
                </div>
                <p style={styles.permSectionDesc}>
                  Define which projects are displayed in tables for this user.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label
                    style={{
                      ...styles.radioCard,
                      borderColor: permsForm.projectAccess === "all" ? "#ff6e00" : "#e2e8f0",
                      background: permsForm.projectAccess === "all" ? "#fff8f3" : "#ffffff",
                    }}
                  >
                    <input
                      type="radio"
                      name="projectAccess"
                      value="all"
                      checked={permsForm.projectAccess === "all"}
                      onChange={() => setPermsForm({ ...permsForm, projectAccess: "all" })}
                      style={{ accentColor: "#ff6e00" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                        🌐 All Company Projects
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        User has global visibility and can see all company projects.
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      ...styles.radioCard,
                      borderColor: permsForm.projectAccess === "assigned" ? "#ff6e00" : "#e2e8f0",
                      background: permsForm.projectAccess === "assigned" ? "#fff8f3" : "#ffffff",
                    }}
                  >
                    <input
                      type="radio"
                      name="projectAccess"
                      value="assigned"
                      checked={permsForm.projectAccess === "assigned"}
                      onChange={() => setPermsForm({ ...permsForm, projectAccess: "assigned" })}
                      style={{ accentColor: "#ff6e00" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0f172a" }}>
                        👤 Assigned Projects Only (PM or Drafter)
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                        User ONLY sees projects where their name or email is assigned as Project Manager (PM) or Drafter.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* SECTION 3: ACTIONS AND MODIFICATIONS PERMISSIONS */}
              <div style={styles.permSection}>
                <div style={styles.permSectionHeader}>
                  <FaTasks style={{ color: "#10b981" }} />
                  <span>3. Permitted Actions & Privileges</span>
                </div>
                <p style={styles.permSectionDesc}>
                  Configure write, creation, deletion, and editing permissions.
                </p>

                <div style={styles.checkboxGrid}>
                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canCreateProjects}
                      onChange={(e) => setPermsForm({ ...permsForm, canCreateProjects: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>➕ Create Projects</div>
                      <div style={styles.checkboxSubtitle}>"Add Project" button enabled</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canEditProjects}
                      onChange={(e) => setPermsForm({ ...permsForm, canEditProjects: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>✏️ Edit Projects</div>
                      <div style={styles.checkboxSubtitle}>Edit project details, statuses, and team members</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canDeleteProjects}
                      onChange={(e) => setPermsForm({ ...permsForm, canDeleteProjects: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>🗑️ Delete Projects</div>
                      <div style={styles.checkboxSubtitle}>Authorize project deletion</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canExportProjects}
                      onChange={(e) => setPermsForm({ ...permsForm, canExportProjects: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>📥 Export Data</div>
                      <div style={styles.checkboxSubtitle}>CSV and spreadsheet downloads enabled</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canEditInvoices}
                      onChange={(e) => setPermsForm({ ...permsForm, canEditInvoices: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>💼 Edit Invoices</div>
                      <div style={styles.checkboxSubtitle}>Update invoice billing statuses & amounts</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canEditInterconnection}
                      onChange={(e) => setPermsForm({ ...permsForm, canEditInterconnection: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>⚡ Edit Interconnection</div>
                      <div style={styles.checkboxSubtitle}>Update PTO and grid application statuses</div>
                    </div>
                  </label>

                  <label style={styles.checkboxCard}>
                    <input
                      type="checkbox"
                      checked={permsForm.canManageContractors}
                      onChange={(e) => setPermsForm({ ...permsForm, canManageContractors: e.target.checked })}
                      style={styles.checkboxInput}
                    />
                    <div>
                      <div style={styles.checkboxTitle}>🏢 Manage Contractors</div>
                      <div style={styles.checkboxSubtitle}>Add, edit, or delete contractor companies</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* ACTIONS FOOTER */}
              <div style={styles.formButtons}>
                <button
                  style={{ ...styles.saveBtn, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={handleSavePermissions}
                  disabled={isSavingPerms}
                >
                  <FaCheck /> {isSavingPerms ? "Saving..." : "Save Access & Permissions"}
                </button>
                <button
                  style={styles.cancelBtn}
                  onClick={() => setSelectedUserForPerms(null)}
                  disabled={isSavingPerms}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBADMINS TABLE */}
      {isLoading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Loading users...</p>
        </div>
      ) : subadmins.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🛡️</p>
          <p style={styles.emptyText}>No users created yet</p>
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>
            <FaPlus /> Create first user
          </button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Access & Visibility</th>
                <th style={styles.th}>Action Rights</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subadmins.map((u) => {
                const isSuper = u.role === "admin";
                const isSelf = currentUser?.id === u._id || currentUser?.email === u.email;
                const perms = u.permissions || DEFAULT_PERMISSIONS;

                return (
                  <tr key={u._id} style={styles.tr}>
                    {/* 1. USER */}
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            ...styles.avatar,
                            background: isSuper ? "#fef3c7" : "#e0f2fe",
                            color: isSuper ? "#d97706" : "#0284c7",
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={styles.userName}>
                            {u.name} {isSelf && <span style={styles.selfBadge}>(You)</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. EMAIL */}
                    <td style={styles.td}>
                      <span style={{ color: "#475569", fontSize: "13px" }}>{u.email}</span>
                    </td>

                    {/* 3. ROLE */}
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.roleBadge,
                          background: isSuper ? "#fef3c7" : "#eff6ff",
                          color: isSuper ? "#b45309" : "#1d4ed8",
                          border: `1px solid ${isSuper ? "#fde68a" : "#bfdbfe"}`,
                        }}
                      >
                        {isSuper ? <FaCrown style={{ fontSize: "11px" }} /> : <FaUserShield style={{ fontSize: "11px" }} />}
                        {isSuper ? "Super Admin" : "Sub-Admin"}
                      </span>
                    </td>

                    {/* 4. ACCESS & VISIBILITY BADGES */}
                    <td style={styles.td}>
                      {isSuper ? (
                        <span style={styles.badgeFullAccess}>
                          👑 Full Access (All modules & projects)
                        </span>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          {/* Scope badge */}
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: perms.projectAccess === "assigned" ? "#fff7ed" : "#ecfdf5",
                                color: perms.projectAccess === "assigned" ? "#c2410c" : "#047857",
                                border: `1px solid ${perms.projectAccess === "assigned" ? "#fed7aa" : "#a7f3d0"}`,
                              }}
                            >
                              {perms.projectAccess === "assigned" ? "👤 Assigned Projects Only" : "🌐 All Projects"}
                            </span>
                          </div>

                          {/* Modules pills */}
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            <span style={perms.canViewProjects ? styles.modulePillActive : styles.modulePillInactive} title="Projects">
                              {perms.canViewProjects ? <FaCheck style={{ fontSize: "9px" }} /> : <FaTimes style={{ fontSize: "9px" }} />} Projects
                            </span>
                            <span style={perms.canViewInterconnection ? styles.modulePillActive : styles.modulePillInactive} title="Interconnection">
                              {perms.canViewInterconnection ? <FaCheck style={{ fontSize: "9px" }} /> : <FaTimes style={{ fontSize: "9px" }} />} Interco
                            </span>
                            <span style={perms.canViewInvoices ? styles.modulePillActive : styles.modulePillInactive} title="Invoices">
                              {perms.canViewInvoices ? <FaCheck style={{ fontSize: "9px" }} /> : <FaTimes style={{ fontSize: "9px" }} />} Invoices
                            </span>
                            <span style={perms.canViewContractors ? styles.modulePillActive : styles.modulePillInactive} title="Contractors">
                              {perms.canViewContractors ? <FaCheck style={{ fontSize: "9px" }} /> : <FaTimes style={{ fontSize: "9px" }} />} Contractors
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* 5. ACTIONS PERMISSIONS */}
                    <td style={styles.td}>
                      {isSuper ? (
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                          All actions permitted
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "240px" }}>
                          {perms.canCreateProjects && (
                            <span style={styles.actionPill}>+ Create</span>
                          )}
                          {perms.canEditProjects && (
                            <span style={styles.actionPill}>✏️ Edit</span>
                          )}
                          {perms.canDeleteProjects ? (
                            <span style={{ ...styles.actionPill, background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                              🗑️ Delete
                            </span>
                          ) : (
                            <span style={{ ...styles.actionPill, background: "#f8fafc", color: "#94a3b8" }}>
                              🚫 No Delete
                            </span>
                          )}
                          {perms.canExportProjects && (
                            <span style={styles.actionPill}>📥 Export</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 6. ACTIONS BUTTONS */}
                    <td style={styles.tdRight}>
                      <div style={styles.actionsWrap}>
                        {!isSuper && (
                          <button
                            style={styles.iconBtnPerms}
                            onClick={() => handleOpenPermissions(u)}
                            title="Manage access and permissions"
                          >
                            <FaKey /> <span>Permissions</span>
                          </button>
                        )}
                        <button
                          style={styles.iconBtnEdit}
                          onClick={() => handleEdit(u)}
                          title="Edit user profile"
                        >
                          <FaEdit />
                        </button>
                        {!isSelf && (
                          <button
                            style={styles.iconBtnDelete}
                            onClick={() => handleDelete(u._id, u.name)}
                            title="Delete this user account"
                          >
                            <FaTrash />
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
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: "13.5px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(255, 110, 0, 0.25)",
    transition: "all 0.2s ease",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },
  statIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statNumber: {
    fontSize: "18px",
    fontWeight: 800,
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "11.5px",
    fontWeight: 600,
    color: "#64748b",
  },
  tableWrapper: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  table: {
    width: "100%",
    minWidth: "820px",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
  },
  thRight: {
    padding: "14px 16px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
    textAlign: "right",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s ease",
  },
  td: {
    padding: "14px 16px",
    verticalAlign: "middle",
  },
  tdRight: {
    padding: "14px 16px",
    verticalAlign: "middle",
    textAlign: "right",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "14px",
    flexShrink: 0,
  },
  userName: {
    fontWeight: 600,
    fontSize: "14px",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  selfBadge: {
    fontSize: "11px",
    color: "#0284c7",
    background: "#e0f2fe",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: 700,
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: 700,
  },
  badgeFullAccess: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  modulePillActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10.5px",
    fontWeight: 700,
    background: "#ecfdf5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  modulePillInactive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10.5px",
    fontWeight: 600,
    background: "#f1f5f9",
    color: "#94a3b8",
    border: "1px solid #e2e8f0",
  },
  actionPill: {
    fontSize: "10.5px",
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: "4px",
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  actionsWrap: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "flex-end",
  },
  iconBtnPerms: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  iconBtnEdit: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #cbd5e1",
    padding: "6px 8px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  iconBtnDelete: {
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "6px 8px",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
  },
  formCard: {
    background: "#fff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    overflow: "hidden",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 24px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  formTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
    color: "#0f172a",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#64748b",
  },
  formBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "10px 14px",
    background: "#fff",
  },
  inputIcon: {
    color: "#94a3b8",
    marginRight: "10px",
    fontSize: "14px",
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14px",
    color: "#0f172a",
    background: "transparent",
  },
  select: {
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },
  formButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "8px",
  },
  saveBtn: {
    padding: "10px 18px",
    background: "#ff6e00",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(255,110,0,0.3)",
  },
  cancelBtn: {
    padding: "10px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
  },
  presetBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#fef3c7",
    color: "#b45309",
    border: "1px solid #fde68a",
    transition: "all 0.15s ease",
  },
  permSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  permSectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13.5px",
    fontWeight: 700,
    color: "#0f172a",
  },
  permSectionDesc: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "8px",
    marginTop: "4px",
  },
  checkboxCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "10px 12px",
    background: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  checkboxInput: {
    marginTop: "3px",
    accentColor: "#ff6e00",
    cursor: "pointer",
  },
  checkboxTitle: {
    fontWeight: 700,
    fontSize: "13px",
    color: "#1e293b",
  },
  checkboxSubtitle: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  radioCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  empty: {
    padding: "48px 24px",
    textAlign: "center",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "36px",
    margin: 0,
  },
  emptyText: {
    fontSize: "15px",
    color: "#64748b",
    margin: 0,
  },
};
