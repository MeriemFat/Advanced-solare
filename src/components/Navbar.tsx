import React from "react";
import logoSolar from "../assets/logoSolar.png";

const Navbar: React.FC = () => {
  return (
    <nav style={styles.nav} className="responsive-nav">
      <div style={styles.logoContainer}>
        <img
          src={logoSolar}
          alt="Advanced Solar Solutions"
          style={styles.logo}
          className="responsive-logo"
        />
      </div>
      <div style={styles.links} className="responsive-links">
        <a href="#home" style={styles.link} className="responsive-link">
         <h3> Home</h3>
        </a>
        <a href="#services" style={styles.link} className="responsive-link">
          <h3>Services</h3>
        </a>
<a
  href="https://client.advancedsolarpermits.com/#/auth/login"
  target="_blank"
  rel="noopener noreferrer"
  style={styles.link}
  className="responsive-link"
>
  <h3>Portal</h3>
</a>
        <a href="#contact" style={styles.contactButton} className="responsive-contact-button">
          <h3>Contact</h3>
        </a>
      </div>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  nav: {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "90%",
    maxWidth: "1400px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 35px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid #ff6e00",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  logoContainer: {
    display: "flex",
    alignItems: "center",
  },

  logo: {
    width: "120px",
    height: "auto",
    cursor: "pointer",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },

  link: {
    textDecoration: "none",
    color: "#333",
    fontSize: "16px",
    fontWeight: 600,
    transition: "0.3s ease",
  },

  contactButton: {
    textDecoration: "none",
    backgroundColor: "#ff6e00",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "20px",
    boxShadow: "0 8px 20px rgba(255,110,0,0.25)",
  },
};

export default Navbar;