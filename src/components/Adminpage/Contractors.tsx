import { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import {
  getContractors,
  createContractor,
  updateContractor,
  deleteContractor,
  type Contractor,
} from "../../lib/api";

export default function Contractors() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nom, setNom] = useState("");

  useEffect(() => {
    getContractors()
      .then(setContractors)
      .catch((err) => alert(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const resetForm = () => {
    setNom("");
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      alert("Please enter a name!");
      return;
    }

    try {
      if (editingId) {
        const updated = await updateContractor(editingId, { nom });
        setContractors(contractors.map((c) => (c._id === editingId ? updated : c)));
      } else {
        const created = await createContractor({ nom });
        setContractors([created, ...contractors]);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setNom(contractor.nom);
    setEditingId(contractor._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContractor(id);
      setContractors(contractors.filter((c) => c._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-projects-section" style={{ border: "1.5px solid #eef2f6" }}>
      <div style={styles.headerRow}>
        <h2 className="admin-main-title" style={{ fontSize: "clamp(22px, 3.5vw, 30px)" }}>Contractors</h2>
        <button className="admin-btn-primary" onClick={() => setShowForm(true)}>
          <FaPlus /> Add Contractor
        </button>
      </div>

      {showForm && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: "480px" }}>
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>
                {editingId ? "✏️ Edit Contractor" : "➕ New Contractor"}
              </h3>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>

            <input
              type="text"
              placeholder="Contractor name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              style={styles.input}
            />

            <div className="admin-form-actions">
              <button style={styles.saveBtn} onClick={handleSave}>
                {editingId ? "Update" : "Create Contractor"}
              </button>
              <button style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>Loading contractors...</p>
        </div>
      ) : contractors.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyIcon}>📭</p>
          <p style={styles.emptyText}>No contractors yet</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table" style={{ minWidth: "100%" }}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor._id} style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.tdAccent }}>{contractor.nom}</td>
                  <td style={styles.td}>
                    <div style={styles.tableActions}>
                      <button style={styles.iconBtnEdit} onClick={() => handleEdit(contractor)} title="Edit">
                        <FaEdit />
                      </button>
                      <button style={styles.iconBtnDelete} onClick={() => handleDelete(contractor._id)} title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
    marginBottom: "24px",
    gap: "14px",
    flexWrap: "wrap",
  },

  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "14px",
    borderBottom: "1.5px solid #f1f5f9",
  },

  formTitle: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#1e3c72",
    margin: 0,
  },

  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "22px",
    cursor: "pointer",
    color: "#64748b",
    padding: 0,
  },

  input: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "20px",
    border: "1.5px solid #cbd5e1",
    borderRadius: "10px",
    fontSize: "14.5px",
    boxSizing: "border-box",
    outline: "none",
    color: "#0f172a",
    background: "#fff",
  },

  saveBtn: {
    flex: 1,
    padding: "12px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14.5px",
    boxShadow: "0 6px 16px rgba(255, 110, 0, 0.25)",
  },

  cancelBtn: {
    flex: 1,
    padding: "12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14.5px",
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
  },

  td: {
    padding: "12px 16px",
    color: "#334155",
    verticalAlign: "middle",
  },

  tdAccent: {
    boxShadow: "inset 3px 0 0 0 #3b82f6",
    fontSize: "15px",
    fontWeight: 700,
    color: "#0f172a",
  },

  tableActions: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
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
