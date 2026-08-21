import React from "react";

const Footer: React.FC = () => {
  return (
    <footer style={styles.footer} className="responsive-footer">
      <p style={styles.footerText}>© 2026 Advanced Solar Solutions. All rights reserved.</p>
    </footer>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
 footer: {
  width: "100%",
  textAlign: "center",
  padding: "20px",
  backgroundColor: "#02071d",
  color: "#fff",
},
 footerText: {
  fontSize: "14px",
 }
};

export default Footer;      