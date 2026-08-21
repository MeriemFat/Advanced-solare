import { useState } from "react";
import { FaEnvelope, FaLock, FaUserShield } from "react-icons/fa";
import Dashboard from "./Dashbord";
import { loginAdmin } from "../../lib/api";
import "../../index.css";

type AdminUser = { id?: string; name: string; email: string; role?: string };

export default function AdminPage() {
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("adminToken"));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const persistSession = (token: string, authUser: AdminUser) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(authUser));
    setUser(authUser);
    setIsAuthenticated(true);
  };

  // SIGN IN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signInData.email.trim() || !signInData.password.trim()) {
      setErrorMessage("Veuillez saisir votre email et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const { token, user: authUser } = await loginAdmin(signInData.email.trim(), signInData.password.trim());
      persistSession(token, authUser);
      setSignInData({ email: "", password: "" });
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  // SIGN OUT
  const handleSignOut = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsAuthenticated(false);
    setUser(null);
  };

  // IF AUTHENTICATED -> SHOW DASHBOARD
  if (isAuthenticated) {
    return (
      <Dashboard
        user={user}
        onLogout={handleSignOut}
      />
    );
  }

  // SIGN IN ONLY FORM
  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        {/* HEADER ICON & TITLE */}
        <div style={styles.cardHeader}>
          <div style={styles.iconCircle}>
            <FaUserShield style={{ fontSize: "28px", color: "#ff6e00" }} />
          </div>
          <h2 style={styles.formTitle}>Admin Portal</h2>
          <p style={styles.formSubtitle}>
            Connectez-vous à votre espace de gestion
          </p>
        </div>

        {/* ERROR ALERT */}
        {errorMessage && (
          <div style={styles.errorAlert}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* SIGN IN FORM */}
        <form onSubmit={handleSignIn} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Adresse Email</label>
            <div style={styles.inputWrapper}>
              <FaEnvelope style={styles.icon} />
              <input
                type="email"
                placeholder="wa.bjaoui@gmail.com"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                style={styles.input}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.icon} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div style={styles.cardFooter}>
          <span style={styles.secureText}>
            🔒 Accès réservé et sécurisé aux administrateurs
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  authContainer: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e3c72 50%, #2a5298 100%)",
    padding: "clamp(16px, 4vw, 40px)",
    boxSizing: "border-box",
  },

  authCard: {
    width: "100%",
    maxWidth: "480px",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 25px 70px rgba(0, 0, 0, 0.35)",
    overflow: "hidden",
    boxSizing: "border-box",
    border: "1.5px solid rgba(255, 255, 255, 0.2)",
  },

  cardHeader: {
    padding: "36px 32px 16px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  iconCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "rgba(255, 110, 0, 0.1)",
    border: "1.5px solid rgba(255, 110, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },

  formTitle: {
    fontSize: "clamp(24px, 4vw, 28px)",
    fontWeight: 900,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },

  formSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "6px 0 0 0",
  },

  errorAlert: {
    margin: "0 32px 10px",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: 600,
  },

  form: {
    padding: "16px 32px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#334155",
  },

  inputWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1.5px solid #cbd5e1",
    borderRadius: "12px",
    padding: "12px 16px",
    transition: "all 0.2s ease",
    background: "#f8fafc",
  },

  icon: {
    color: "#ff6e00",
    marginRight: "12px",
    fontSize: "16px",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "14.5px",
    background: "transparent",
    color: "#0f172a",
    width: "100%",
  },

  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    fontSize: "15.5px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "6px",
    boxShadow: "0 8px 24px rgba(255, 110, 0, 0.35)",
    transition: "all 0.2s ease",
  },

  cardFooter: {
    padding: "16px 32px 24px",
    background: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
    textAlign: "center",
  },

  secureText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: 600,
  },
};