import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaCrown, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import {
  getSubadmins,
  createSubadmin,
  updateSubadmin,
  deleteSubadmin,
  type SubadminUser,
} from "../../lib/api";

type SubadminsProps = {
  currentUser: { id?: string; name: string; email: string; role?: string } | null;
};

export default function Subadmins({ currentUser }: SubadminsProps) {
  const [subadmins, setSubadmins] = useState<SubadminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "subadmin" as "admin" | "subadmin",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSubadmins = () => {
    setIsLoading(true);
    getSubadmins()
      .then(setSubadmins)
      .catch((err) => alert(err.message || "Error loading administrators"))
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

  const totalAdmins = subadmins.length;
  const superAdminsCount = subadmins.filter((u) => u.role === "admin").length;
  const subAdminsCount = subadmins.filter((u) => u.role === "subadmin").length;

  return (
    <div style={styles.section}>
      {/* HEADER SECTION */}
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>Sub-Administrators Management</h2>
          <p style={styles.subtitle}>
            Create and manage sub-administrator accounts authorized to manage projects.
          </p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(true)}>
          <FaPlus /> New Sub-Admin
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
            <div style={styles.statLabel}>Super Admins</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconWrap, background: "#e0f2fe", color: "#0284c7" }}>
            <FaUserShield style={{ fontSize: "20px" }} />
          </div>
          <div>
            <div style={styles.statNumber}>{subAdminsCount}</div>
            <div style={styles.statLabel}>Active Sub-Admins</div>
          </div>
        </div>
      </div>

      {/* MODAL FORM */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {editingId ? "✏️ Edit Sub-Admin" : "➕ Create Sub-Admin"}
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
                    placeholder="Ex: Meriem Fathallah"
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
                    placeholder="subadmin@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  {editingId ? "New Password (leave blank to keep current)" : "Password"}
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
                  <option value="subadmin">🛡️ Sub-Admin (Projects & Files Management)</option>
                  <option value="admin">👑 Super Admin (Full Access)</option>
                </select>
              </div>

              <div style={styles.formButtons}>
                <button style={styles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Create Sub-Admin"}
                </button>
                <button style={styles.cancelBtn} onClick={resetForm} disabled={isSubmitting}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBADMINS TABLE */}
      {isLoading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Loading sub-administrators...</p>
        </div>
      ) : subadmins.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>🛡️</p>
          <p style={styles.emptyText}>No sub-administrators created yet</p>
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>
            <FaPlus /> Create first Sub-Admin
          </button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role / Permissions</th>
                <th style={styles.th}>Created Date</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subadmins.map((u) => {
                const isSuper = u.role === "admin";
                const isSelf = currentUser?.id === u._id || currentUser?.email === u.email;

                return (
                  <tr key={u._id} style={styles.tr}>
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
                    <td style={styles.td}>
                      <span style={{ color: "#475569", fontSize: "13.5px" }}>{u.email}</span>
                    </td>
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
                    <td style={styles.td}>
                      <span style={{ color: "#64748b", fontSize: "13px" }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td style={styles.tdRight}>
                      <div style={styles.actionsWrap}>
                        <button
                          style={styles.iconBtnEdit}
                          onClick={() => handleEdit(u)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        {!isSelf && (
                          <button
                            style={styles.iconBtnDelete}
                            onClick={() => handleDelete(u._id, u.name)}
                            title="Delete this account"
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
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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
    minWidth: "620px",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "14px 18px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 600,
    fontSize: "13px",
    borderBottom: "1px solid #e2e8f0",
  },
  thRight: {
    padding: "14px 18px",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 600,
    fontSize: "13px",
    textAlign: "right",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.15s ease",
  },
  td: {
    padding: "14px 18px",
    verticalAlign: "middle",
  },
  tdRight: {
    padding: "14px 18px",
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
  },
  userName: {
    fontWeight: 600,
    color: "#0f172a",
    fontSize: "14px",
  },
  selfBadge: {
    fontSize: "11px",
    color: "#ff6e00",
    fontWeight: 600,
    marginLeft: "4px",
  },
  roleBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
  },
  actionsWrap: {
    display: "inline-flex",
    gap: "8px",
  },
  iconBtnEdit: {
    background: "#f1f5f9",
    color: "#0284c7",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  iconBtnDelete: {
    background: "#fef2f2",
    color: "#ef4444",
    border: "none",
    borderRadius: "6px",
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
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
    gap: "16px",
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
