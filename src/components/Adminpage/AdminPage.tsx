import { useState } from "react";
import { FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import Dashboard from "./Dashbord";
import { loginAdmin, registerAdmin } from "../../lib/api";
import "../../index.css";

type AdminUser = { id?: string; name: string; email: string; role?: string };

export default function AdminPage() {
  const [isSignIn, setIsSignIn] = useState(true);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("adminToken"));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const persistSession = (token: string, authUser: AdminUser) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("adminUser", JSON.stringify(authUser));
    setUser(authUser);
    setIsAuthenticated(true);
  };

  // SIGN IN
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    if (!signInData.email || !signInData.password) {
      alert("Please fill in all fields!");
      return;
    }

    setIsLoading(true);
    try {
      const { token, user: authUser } = await loginAdmin(signInData.email, signInData.password);
      persistSession(token, authUser);
      setSignInData({ email: "", password: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // SIGN UP
  const handleSignUp = async (e: any) => {
    e.preventDefault();
    if (!signUpData.name || !signUpData.email || !signUpData.password || !signUpData.confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);
    try {
      const { token, user: authUser } = await registerAdmin(signUpData.name, signUpData.email, signUpData.password);
      persistSession(token, authUser);
      setSignUpData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (err: any) {
      alert(err.message);
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
    setIsSignIn(true);
  };

  // IF AUTHENTICATED
  if (isAuthenticated) {
    return (
      <Dashboard
        user={user}
        onLogout={handleSignOut}
      />
    );
  }

  // FORMS
  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        {/* TABS */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(isSignIn ? styles.tabActive : styles.tabInactive),
            }}
            onClick={() => setIsSignIn(true)}
          >
            Sign In
          </button>
          <button
            style={{
              ...styles.tab,
              ...(isSignIn ? styles.tabInactive : styles.tabActive),
            }}
            onClick={() => setIsSignIn(false)}
          >
            Sign Up
          </button>
        </div>

        {/* SIGN IN FORM */}
        {isSignIn && (
          <form onSubmit={handleSignIn} style={styles.form}>
            <h2 style={styles.formTitle}>Sign In</h2>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.icon} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" style={styles.submitBtn} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* SIGN UP FORM */}
        {!isSignIn && (
          <form onSubmit={handleSignUp} style={styles.form}>
            <h2 style={styles.formTitle}>Create an Account</h2>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <FaUser style={styles.icon} />
                <input
                  type="text"
                  placeholder="Your name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <div style={styles.inputWrapper}>
                <FaEnvelope style={styles.icon} />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <FaLock style={styles.icon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              Sign Up
            </button>
          </form>
        )}
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
    background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #ff6e00 100%)",
    padding: "clamp(16px, 4vw, 40px)",
    boxSizing: "border-box",
  },

  authCard: {
    width: "100%",
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  tabs: {
    display: "flex",
    borderBottom: "2px solid #f0f0f0",
  },

  tab: {
    flex: 1,
    padding: "16px 12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 700,
    transition: "all 0.3s ease",
    textAlign: "center",
  },

  tabActive: {
    color: "#ff6e00",
    borderBottom: "3px solid #ff6e00",
    marginBottom: "-2px",
  },

  tabInactive: {
    color: "#94a3b8",
  },

  form: {
    padding: "clamp(24px, 5vw, 40px)",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    boxSizing: "border-box",
  },

  formTitle: {
    fontSize: "clamp(22px, 4vw, 28px)",
    fontWeight: 800,
    color: "#1e3c72",
    marginBottom: "4px",
    textAlign: "center",
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
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    padding: "10px 14px",
    transition: "all 0.2s ease",
    background: "#f8fafc",
  },

  icon: {
    color: "#ff6e00",
    marginRight: "10px",
    fontSize: "15px",
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
    padding: "13px",
    background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 8px 20px rgba(255, 110, 0, 0.28)",
    transition: "all 0.2s ease",
  },
};