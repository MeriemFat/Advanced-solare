import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserShield, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import Dashboard from "./Dashbord";
import { loginAdmin, type AuthUser } from "../../lib/api";
import logoSolar from "../../assets/logoSolar.png";
import "../../index.css";

export default function AdminPage() {
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("adminToken"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const persistSession = (token: string, authUser: AuthUser) => {
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
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const { token, user: authUser } = await loginAdmin(signInData.email.trim(), signInData.password.trim());
      persistSession(token, authUser);
      setSignInData({ email: "", password: "" });
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check your credentials.");
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
      {/* TOP BAR / BACK TO SITE */}
      <div style={styles.topBar}>
        <Link to="/" style={styles.backButton}>
          <FaArrowLeft style={{ fontSize: "14px" }} />
          <span>Back to Site</span>
        </Link>
      </div>

      <div style={styles.authCard}>
        {/* HEADER ICON & TITLE */}
        <div style={styles.cardHeader}>
          <div style={styles.logoBadgeContainer}>
            <img src={logoSolar} alt="Advanced Solar" style={styles.logoImage} />
          </div>

          <div style={styles.badgeRow}>
            <FaUserShield style={{ color: "#ff6e00", fontSize: "16px" }} />
            <span style={styles.badgeText}>Admin Portal</span>
          </div>

          <h2 style={styles.formTitle}>Welcome Back</h2>
          <p style={styles.formSubtitle}>
            Sign in to access your management dashboard
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
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <FaEnvelope style={styles.icon} />
              <input
                type="email"
                placeholder="admin@example.com"
                value={signInData.email}
                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                style={styles.input}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <FaLock style={styles.icon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={styles.cardFooter}>
          <span style={styles.secureText}>
            🔒 Secure access for administrators only
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
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0b1120 0%, #172554 50%, #1e3a8a 100%)",
    padding: "clamp(16px, 4vw, 40px)",
    boxSizing: "border-box",
    position: "relative",
  },

  topBar: {
    position: "absolute",
    top: "24px",
    left: "24px",
    zIndex: 10,
  },

  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 18px",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    color: "#ffffff",
    borderRadius: "12px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    transition: "all 0.2s ease",
  },

  authCard: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    boxSizing: "border-box",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },

  cardHeader: {
    padding: "36px 32px 14px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  logoBadgeContainer: {
    marginBottom: "14px",
  },

  logoImage: {
    height: "44px",
    width: "auto",
    objectFit: "contain",
  },

  badgeRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    background: "rgba(255, 110, 0, 0.08)",
    border: "1px solid rgba(255, 110, 0, 0.2)",
    borderRadius: "20px",
    marginBottom: "12px",
  },

  badgeText: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#ff6e00",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  formTitle: {
    fontSize: "clamp(24px, 4vw, 28px)",
    fontWeight: 800,
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
    gap: "18px",
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
    padding: "11px 14px",
    transition: "all 0.2s ease",
    background: "#f8fafc",
  },

  icon: {
    color: "#ff6e00",
    marginRight: "10px",
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

  togglePasswordBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    transition: "color 0.2s ease",
  },

  submitBtn: {
    padding: "14px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ea580c 100%)",
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