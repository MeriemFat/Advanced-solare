import React, { useEffect, useRef } from "react";
import { FaLock, FaSignOutAlt, FaShieldAlt } from "react-icons/fa";

export interface SessionExpiredModalProps {
  isOpen: boolean;
  onConfirmLogout: () => void;
  message?: string;
  title?: string;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  isOpen,
  onConfirmLogout,
  title = "Session Expired",
  message = "Your session has expired. Please log in again.",
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Lock background scroll and handle Enter/Escape keys
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      buttonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          onConfirmLogout();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, onConfirmLogout]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes sessionModalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sessionModalCard {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(14px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes sessionIconPulse {
          0%, 100% {
            box-shadow: 0 14px 30px -6px rgba(234, 88, 12, 0.35);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 18px 42px -4px rgba(234, 88, 12, 0.6);
            transform: scale(1.04);
          }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999999, // Super high z-index to overlay any dropdown or modal
          padding: "20px",
          animation: "sessionModalBackdrop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
          style={{
            background: "#ffffff",
            borderRadius: "24px",
            width: "100%",
            maxWidth: "440px",
            boxShadow:
              "0 25px 60px -15px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(226, 232, 240, 0.95)",
            overflow: "hidden",
            textAlign: "center",
            padding: "38px 32px 32px",
            position: "relative",
            boxSizing: "border-box",
            animation: "sessionModalCard 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }}
        >
          {/* Glowing Lock Badge */}
          <div
            style={{
              width: "76px",
              height: "76px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              border: "2px solid #fed7aa",
              color: "#ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "30px",
              animation: "sessionIconPulse 2.4s ease-in-out infinite",
            }}
          >
            <FaLock />
          </div>

          {/* Title */}
          <h3
            id="session-expired-title"
            style={{
              margin: "0 0 10px 0",
              fontSize: "23px",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.4px",
            }}
          >
            {title}
          </h3>

          {/* User Requested Message */}
          <p
            style={{
              margin: "0 0 18px 0",
              fontSize: "15px",
              fontWeight: 500,
              color: "#475569",
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>

          {/* Security Pill Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "9999px",
              padding: "6px 14px",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: 600,
              marginBottom: "26px",
            }}
          >
            <FaShieldAlt style={{ color: "#ff6e00", fontSize: "13px" }} />
            <span>Security Timeout • Re-authentication Required</span>
          </div>

          {/* Action Button: Log Out & Reconnect */}
          <div>
            <button
              ref={buttonRef}
              type="button"
              onClick={onConfirmLogout}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: "14px",
                border: "none",
                background: "linear-gradient(135deg, #ff6e00 0%, #ff8533 100%)",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 10px 24px -4px rgba(255, 110, 0, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 14px 28px -4px rgba(255, 110, 0, 0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 24px -4px rgba(255, 110, 0, 0.45)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(1px)";
              }}
            >
              <FaSignOutAlt style={{ fontSize: "16px" }} />
              <span>Log Out & Log In Again</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionExpiredModal;
