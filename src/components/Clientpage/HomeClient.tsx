import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa"; 
import solarBg from "../../assets/solar2.png"; 
import linkedinIcon from "../../assets/linkedin.png";
import facebookIcon from "../../assets/facebook.png";  
import heroVideo from "../../assets/solardesign-permitsets-contractorsupport-renewableenergy-ahjapproval-photovoltaic-advanced-solar-solutions.mp4";
import "../../index.css";
export default function HomeClient() {
  return (
    <>
      {/* HOME */}
      <div id="home" style={styles.contactInfoSectionHead} className="responsive-contact-info-section">
        <div style={styles.heroOverlay} className="responsive-hero-overlay">
          <span style={styles.heroBadge} className="responsive-hero-badge">
            Trusted by Solar Contractors Across the U.S.
          </span>
          <div style={styles.heroContent} className="responsive-hero-content">
            <div style={styles.leftColumn}>
              <h1 style={styles.heroTitle} className="responsive-hero-title">
                Unlock Success with<br />Expert Solar Plan Sets
              </h1>
              <p style={styles.heroDescription} className="responsive-hero-description">
                As contractors, your focus is on delivering exceptional solar installations quickly, efficiently, and hassle-free. That's where Advanced Solar Solutions comes in.
              </p>
              <div style={styles.featuresContainer}>
                <div style={styles.featureCard} className="responsive-feature-card">
                  ✓ Faster AHJ Approvals with Accurate Plan Sets
                </div>
                <div style={styles.featureCard} className="responsive-feature-card">
                  ✓ Optimized Designs for Smoother Installations
                </div>
                <div style={styles.featureCard} className="responsive-feature-card">
                  ✓ Engineering Support & Structural Stamps
                </div>
                <div style={styles.featureCard} className="responsive-feature-card">
                  ✓ Equipment Recommendations & Code Compliance
                </div>
              </div>
              <div style={styles.heroButtons} className="responsive-hero-buttons">
                <a href="#contact" style={styles.primaryButton} className="responsive-primary-button">Get a Quote</a>
                <a href="#services" style={styles.secondaryButton} className="responsive-secondary-button">Our Services</a>
                <a href="/admin" style={{ display: "none" }}>Admin</a>
              </div>
            </div>
            <div style={styles.videoCard}>
              <video autoPlay muted loop playsInline controls style={styles.video}>
                <source src={heroVideo} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div id="services" style={styles.contactInfoSection} className="responsive-contact-info-section">
        <h3 style={styles.servicesTitle}>Our Comprehensive Solar and Battery Services</h3>
        <div style={styles.servicesGrid} className="responsive-services-grid">
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>▣</div>
            <h4 style={styles.serviceCardTitle}>Solar Plan Sets</h4>
            <p style={styles.serviceText}>Complete permit-ready solar designs, certified stamped plans.</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>☀</div>
            <h4 style={styles.serviceCardTitle}>Solar Engineering</h4>
            <p style={styles.serviceText}>Expert code calculations, structural analysis and approvals.</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>⚡</div>
            <h4 style={styles.serviceCardTitle}>Electrical Engineering for Solar and Battery Systems</h4>
            <p style={styles.serviceText}>Detailed electrical layouts and battery system designs.</p>
          </div>
          <div style={styles.serviceCard}>
            <div style={styles.serviceIcon}>◫</div>
            <h4 style={styles.serviceCardTitle}>Commercial Solar Design</h4>
            <p style={styles.serviceText}>Commercial solar designs with complete documentation.</p>
          </div>
        </div>
      </div>

      {/* PORTAL */}
      <div id="portal" style={styles.portalSection}>
        <div style={styles.portalOverlay} className="responsive-portal-overlay">
          <span style={styles.portalBadge} className="responsive-portal-badge">OUR SERVICES MATRIX</span>
          <h1 style={styles.portalTitle} className="responsive-portal-title">Explore Our Design Tool</h1>
          <p style={styles.portalDescription}>
            From permit plan sets to engineering support and consulting, Advanced Solar Solutions provides everything contractors need to complete successful solar projects.
          </p>
          <div style={styles.portalGrid} className="responsive-portal-grid">
            <div style={styles.portalCard}>
              <h2 style={styles.cardHeading}>📐 Plan Sets & Design</h2>
              <ul style={styles.portalList}>
                <li>✔ Solar Plan Sets</li>
                <li>✔ Residential Solar Design</li>
                <li>✔ Commercial Solar Design</li>
                <li>✔ PV System Design</li>
                <li>✔ Code-Compliant Layouts</li>
                <li>✔ Battery Design</li>
                <li>✔ Single Line Diagrams</li>
                <li>✔ ESS Design</li>
                <li>✔ Off-Grid System Design</li>
              </ul>
            </div>
            <div style={styles.portalCard}>
              <h2 style={styles.cardHeading}>⚙ Engineering & Battery</h2>
              <ul style={styles.portalList}>
                <li>✔ Solar Engineering</li>
                <li>✔ Electrical Engineering & stamps</li>
                <li>✔ Structural Engineering</li>
                <li>✔ Battery Storage Design</li>
              </ul>
            </div>
            <div style={styles.portalCard}>
              <h2 style={styles.cardHeading}>🚀 Consulting</h2>
              <ul style={styles.portalList}>
                <li>✔ AHJ Consulting</li>
                <li>✔ Utility Consulting</li>
                <li>✔ Rapid Permit Support</li>
                <li>✔ Contractor Assistance</li>
                <li>✔ Project Review</li>
                <li>✔ Design Optimization</li>
                <li>✔ Technical Consultation</li>
              </ul>
            </div>
          </div>
          <a href="https://client.advancedsolarpermits.com/#/auth/login" target="_blank" rel="noopener noreferrer" style={styles.portalButton}>
            Request a Consultation
          </a>
        </div>
      </div>

      {/* CONTACT */}
      <div id="contact" style={styles.contactSection}>
        <div style={styles.contactInfoSection} className="responsive-contact-info-section">
          <h2 style={styles.contactHeading} className="responsive-contact-heading">Get in Touch With Us</h2>
          <div style={styles.contactGrid} className="responsive-contact-grid">
            <div style={styles.infoCard}>
              <div style={styles.iconCircle}>
                <FaEnvelope size={30} color="#ff6e00" />
              </div>
              <h3 style={styles.infoTitle}>Email</h3>
              <p style={styles.infoValue}>projects@advpermits.com</p>
              <p style={styles.infoDescription}>
                Our primary channel for permit requests, project discussions and customer support.
              </p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.iconCircle}>
                <FaPhone size={30} color="#ff6e00" />
              </div>
              <h3 style={styles.infoTitle}>Phone</h3>
              <p style={styles.infoValue}>559-321-7000</p>
              <p style={styles.infoDescription}>
                Speak directly with one of our solar permit specialists during business hours.
              </p>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.iconCircle}>
                <FaMapMarkerAlt size={30} color="#ff6e00" />
              </div>
              <h3 style={styles.infoTitle}>Coverage</h3>
              <p style={styles.infoValue}>50-State Service</p>
              <p style={styles.infoDescription}>
                We provide solar permit design services for contractors across the United States.
              </p>
            </div>
          </div>
          <div style={styles.bottomMessage} className="responsive-bottom-message">
            <span style={styles.followText}>Follow us on : </span>
            <div style={styles.socialIcons}>
              <a href="https://www.linkedin.com/company/advanced-solar/" target="_blank" rel="noopener noreferrer">
                <img src={linkedinIcon} alt="LinkedIn" style={styles.socialIconLinkedin} />
              </a>
              <a href="https://www.facebook.com/share/1ESeRyhky7/" target="_blank" rel="noopener noreferrer">
                <img src={facebookIcon} alt="Facebook" style={styles.socialIcon} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { width: "100%", minHeight: "100vh", backgroundImage: `url(${solarBg})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  section: { minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 10%", borderBottom: "1px solid #eee" },
  contactContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "60px", flexWrap: "wrap" },
  contactInfo: { flex: 1, minWidth: "450px" },
  badge: { backgroundColor: "#ff6e00", color: "#fff", padding: "10px 18px", borderRadius: "30px", fontSize: "14px", fontWeight: 600, display: "inline-block" },
  title: { fontSize: "3rem", marginTop: "20px", marginBottom: "20px", color: "#111", lineHeight: 1.2 },
  description: { fontSize: "1.1rem", lineHeight: 1.9, color: "#555", marginBottom: "20px" },
  contactCard: { flex: 1, minWidth: "350px", backgroundColor: "#111", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" },
  cardTitle: { color: "#fff", marginBottom: "30px", fontSize: "1.8rem", textAlign: "center" },
  contactItem: { display: "flex", alignItems: "center", gap: "15px", color: "#fff", textDecoration: "none", fontSize: "1.1rem", padding: "16px", borderRadius: "12px", backgroundColor: "rgba(255,255,255,0.05)", marginBottom: "15px", transition: "all 0.3s ease" },
  contactButton: { marginTop: "20px", width: "100%", padding: "16px", backgroundColor: "#ff6e00", color: "#fff", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: 600 },
  heroSection: { width: "100%", minHeight: "100vh", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", display: "flex", justifyContent: "center", alignItems: "center" },
  heroOverlay: { width: "100%", minHeight: "100vh", background: "rgba(255,255,255,0.55)", padding: "170px 8% 60px", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" },
  heroBadge: { backgroundColor: "#ff6e00", color: "#fff", padding: "14px 25px", borderRadius: "999px", fontWeight: 700, marginBottom: "40px" },
  heroContent: { width: "100%", maxWidth: "1400px", display: "flex", justifyContent: "space-between", gap: "50px" },
  leftColumn: { flex: 1 },
  heroTitle: { fontSize: "4.5rem", fontWeight: 900, lineHeight: 1.1, color: "#111", marginBottom: "25px" },
  heroDescription: { fontSize: "1.25rem", color: "#333", lineHeight: 1.8, marginBottom: "25px" },
  featuresContainer: { display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" },
  featureCard: { backgroundColor: "rgba(255,255,255,0.95)", padding: "18px 20px", borderRadius: "12px", fontSize: "18px", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
  videoCard: { flex: 1, backgroundColor: "#fff", borderRadius: "25px", padding: "8px", border: "3px solid #d4a17b", boxShadow: "0 15px 40px rgba(0,0,0,0.15)" },
  video: { width: "100%", borderRadius: "20px", display: "block" },
  heroButtons: { display: "flex", gap: "15px", marginTop: "30px" },
  primaryButton: { backgroundColor: "#ff6e00", color: "#fff", textDecoration: "none", padding: "18px 35px", borderRadius: "12px", fontWeight: 700, boxShadow: "0 10px 20px rgba(255,110,0,0.25)" },
  secondaryButton: { backgroundColor: "#111", color: "#fff", textDecoration: "none", padding: "18px 35px", borderRadius: "12px", fontWeight: 700 },
  bottomText: { marginTop: "40px", fontSize: "1.2rem", textAlign: "center", color: "#222", maxWidth: "900px" },
  extraContent: { marginTop: "40px", width: "100%" },
  extraTitle: { fontSize: "1.8rem", fontWeight: 700, color: "#111", marginBottom: "25px" },
  extraGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" },
  extraCard: { backgroundColor: "rgba(255,255,255,0.92)", borderRadius: "16px", padding: "20px", boxShadow: "0 8px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(255,110,0,0.15)" },
  extraCardTitle: { color: "#ff6e00", fontSize: "1.1rem", fontWeight: 700, marginBottom: "10px" },
  extraCardText: { color: "#555", lineHeight: 1.7, fontSize: "0.95rem", margin: 0 },
  servicesBox: { marginTop: "35px", width: "97%", backgroundSize: "cover", backgroundPosition: "center", padding: "33px", backgroundRepeat: "no-repeat", boxShadow: "0 15px 35px rgba(0,0,0,0.25)" },
  servicesTitle: { color: "#050353", fontSize: "1.7rem", marginBottom: "20px", fontWeight: 700 },
  servicesGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "15px" },
  serviceCard: { background: "rgba(20,35,55,0.85)", borderRadius: "14px", padding: "20px", minHeight: "130px", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(6px)" },
  serviceIcon: { color: "#f59b42", fontSize: "32px", marginBottom: "12px" },
  serviceCardTitle: { color: "#fff", fontSize: "1.05rem", marginBottom: "10px" },
  serviceText: { color: "#d7d7d7", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 },
  contactInfoSection: { width: "100%", maxWidth: "1300px", margin: "60px auto", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "24px", padding: "45px", border: "2px solid rgba(255,110,0,.2)", boxShadow: "0 20px 45px rgba(0,0,0,.15)" },
  contactHeading: { fontSize: "2.4rem", fontWeight: 700, color: "#111", marginBottom: "35px" },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "25px" },
  infoCard: { backgroundColor: "#fff", borderRadius: "18px", padding: "30px", border: "1px solid #eee", boxShadow: "0 10px 25px rgba(0,0,0,.08)", transition: "0.3s" },
  iconCircle: { width: "65px", height: "65px", borderRadius: "50%", backgroundColor: "rgba(255,110,0,.12)", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" },
  infoTitle: { fontSize: "1.3rem", fontWeight: 700, color: "#111", marginBottom: "10px" },
  infoValue: { color: "#ff6e00", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px" },
  infoDescription: { color: "#666", lineHeight: 1.7, fontSize: "15px" },
  bottomMessage: { marginTop: "35px", backgroundColor: "#f8f8f8", borderRadius: "12px", padding: "20px", border: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" },
  followText: { fontSize: "18px", fontWeight: 600, color: "#333" },
  socialIcons: { display: "flex", gap: "20px" },
  socialIcon: { width: "50px", height: "51px", cursor: "pointer", transition: "transform .3s ease" },
  socialIconLinkedin: { width: "55px", height: "55px", objectFit: "contain", cursor: "pointer", transition: "transform .3s ease" },
  portalSection: { width: "100%", minHeight: "100vh", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", display: "flex", justifyContent: "center", alignItems: "center" },
  portalOverlay: { width: "100%", maxWidth: "1400px", margin: "60px auto", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "24px", padding: "45px", border: "2px solid rgba(255,110,0,.2)", boxShadow: "0 20px 45px rgba(0,0,0,.15)", display: "flex", flexDirection: "column", alignItems: "center", boxSizing: "border-box" },
  portalBadge: { background: "#ff6e00", color: "#fff", padding: "10px 22px", borderRadius: "30px", fontWeight: 700, marginBottom: "18px", letterSpacing: "1px" },
  portalTitle: { fontSize: "3rem", color: "#111", marginBottom: "15px", fontWeight: 800 },
  portalDescription: { maxWidth: "900px", textAlign: "center", fontSize: "18px", color: "#555", lineHeight: 1.8, marginBottom: "60px" },
  portalGrid: { width: "100%", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "25px", marginTop: "35px" },
  portalCard: { backgroundColor: "#fff", borderRadius: "18px", padding: "30px", border: "1px solid #eee", boxShadow: "0 10px 25px rgba(0,0,0,.08)", transition: "0.3s" },
  cardHeading: { color: "#ff6e00", marginBottom: "25px", fontSize: "24px" },
  portalList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "15px", color: "#444", fontSize: "17px", lineHeight: 1.6 },
  portalButton: { marginTop: "55px", background: "#ff6e00", color: "#fff", textDecoration: "none", padding: "18px 45px", borderRadius: "12px", fontWeight: 700, fontSize: "17px", boxShadow: "0 12px 25px rgba(255,110,0,.35)" },
  contactInfoSectionHead: { width: "100%", maxWidth: "1300px", margin: "10px auto", backgroundColor: "rgba(255,255,255,0.95)", borderRadius: "24px", padding: "45px", border: "2px solid rgba(255,110,0,.2)", boxShadow: "0 20px 45px rgba(0,0,0,.15)" },
  contactSection: { width: "100%" }
};