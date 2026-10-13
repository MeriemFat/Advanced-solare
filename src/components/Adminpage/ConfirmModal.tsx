import React, { useEffect } from "react";
import { FaTrashAlt, FaExclamationTriangle, FaTimes, FaSpinner } from "react-icons/fa";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  itemName?: string;
  itemTypeLabel?: string;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  itemTypeLabel = "Item",
  warningNote = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = type === "danger";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "20px",
        animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "22px",
          width: "100%",
          maxWidth: "460px",
          boxShadow:
            "0 25px 60px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.9)",
          overflow: "hidden",
          textAlign: "center",
          padding: "32px 28px 26px",
          position: "relative",
          boxSizing: "border-box",
          animation: "scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            if (!isLoading) onClose();
          }}
          disabled={isLoading}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            color: "#64748b",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            outline: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.borderColor = "#fca5a5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
          title="Close"
        >
          <FaTimes />
        </button>

        {/* Glow Icon Badge */}
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "20px",
            background: isDanger
              ? "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
              : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: isDanger ? "2px solid #fca5a5" : "2px solid #fcd34d",
            color: isDanger ? "#dc2626" : "#d97706",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 18px",
            fontSize: "26px",
            boxShadow: isDanger
              ? "0 12px 28px -6px rgba(239, 68, 68, 0.35)"
              : "0 12px 28px -6px rgba(217, 119, 6, 0.3)",
          }}
        >
          {isDanger ? <FaTrashAlt /> : <FaExclamationTriangle />}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: "0 0 8px 0",
            fontSize: "21px",
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.4px",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: "0 0 18px 0",
            fontSize: "13.5px",
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>

        {/* Item Target Preview Card */}
        {itemName && (
          <div
            style={{
              background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "12px 16px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: isDanger ? "#fee2e2" : "#fef3c7",
                color: isDanger ? "#dc2626" : "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                flexShrink: 0,
              }}
            >
              <FaExclamationTriangle />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {itemTypeLabel}
              </div>
              <div
                style={{
                  fontSize: "14.5px",
                  fontWeight: 800,
                  color: "#0f172a",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={itemName}
              >
                {itemName}
              </div>
            </div>
          </div>
        )}

        {/* Warning Note */}
        {warningNote && (
          <div
            style={{
              fontSize: "12px",
              color: isDanger ? "#ef4444" : "#b45309",
              background: isDanger ? "#fef2f2" : "#fffbeb",
              border: isDanger ? "1px solid #fee2e2" : "1px solid #fef3c7",
              borderRadius: "8px",
              padding: "7px 12px",
              marginBottom: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontWeight: 600,
            }}
          >
            <span>⚠️</span>
            <span>{warningNote}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.3fr",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: isDanger
                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              boxShadow: isDanger
                ? "0 10px 20px -4px rgba(239, 68, 68, 0.45)"
                : "0 10px 20px -4px rgba(217, 119, 6, 0.4)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              outline: "none",
              opacity: isLoading ? 0.75 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = isDanger
                  ? "0 14px 24px -4px rgba(239, 68, 68, 0.55)"
                  : "0 14px 24px -4px rgba(217, 119, 6, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = isDanger
                ? "0 10px 20px -4px rgba(239, 68, 68, 0.45)"
                : "0 10px 20px -4px rgba(217, 119, 6, 0.4)";
            }}
          >
            {isLoading ? (
              <>
                <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaTrashAlt style={{ fontSize: "13px" }} />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
