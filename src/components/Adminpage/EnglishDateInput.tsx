import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";

/**
 * Converts ISO (YYYY-MM-DD) or legacy string to US English format MM/DD/YYYY
 */
export function isoToUS(dateStr?: string | null): string {
  if (!dateStr) return "";
  const s = String(dateStr).trim();
  if (!s) return "";

  // Matches YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (yyyymmdd) {
    const y = yyyymmdd[1];
    const m = String(parseInt(yyyymmdd[2], 10)).padStart(2, "0");
    const d = String(parseInt(yyyymmdd[3], 10)).padStart(2, "0");
    return `${m}/${d}/${y}`;
  }

  // Matches MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    let m = parseInt(slashMatch[1], 10);
    let d = parseInt(slashMatch[2], 10);
    const y = slashMatch[3];
    // If month > 12, it was likely legacy French DD/MM/YYYY
    if (m > 12 && d <= 12) {
      const temp = m;
      m = d;
      d = temp;
    }
    return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}/${y}`;
  }

  return s;
}

/**
 * Converts US English format MM/DD/YYYY to ISO YYYY-MM-DD
 */
export function usToISO(usDateStr?: string | null): string {
  if (!usDateStr) return "";
  const s = String(usDateStr).trim();
  if (!s) return "";

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  // Matches MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    let m = parseInt(slashMatch[1], 10);
    let d = parseInt(slashMatch[2], 10);
    const y = parseInt(slashMatch[3], 10);
    if (m > 12 && d <= 12) {
      const temp = m;
      m = d;
      d = temp;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (
        dt.getUTCFullYear() === y &&
        dt.getUTCMonth() === m - 1 &&
        dt.getUTCDate() === d
      ) {
        return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }

  return s;
}

export type EnglishDateInputChangeEvent = {
  target: {
    value: string; // ISO format YYYY-MM-DD (or empty string)
  };
};

export interface EnglishDateInputProps {
  value?: string;
  onChange?: (e: EnglishDateInputChangeEvent) => void;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
  title?: string;
  id?: string;
}

export const EnglishDateInput: React.FC<EnglishDateInputProps> = ({
  value = "",
  onChange,
  min,
  max,
  placeholder = "mm/dd/yyyy",
  disabled = false,
  required = false,
  style = {},
  className = "",
  title,
  id,
}) => {
  const [text, setText] = useState<string>(() => isoToUS(value));
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(isoToUS(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // Remove non-digit and non-slash characters
    raw = raw.replace(/[^\d/]/g, "");

    // Automatically format as MM/DD/YYYY
    const digitsOnly = raw.replace(/\D/g, "");
    let formatted = "";
    if (digitsOnly.length <= 2) {
      formatted = digitsOnly;
    } else if (digitsOnly.length <= 4) {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
    } else {
      formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}/${digitsOnly.slice(4, 8)}`;
    }

    setText(formatted);

    if (formatted.length === 10) {
      const iso = usToISO(formatted);
      if (iso && iso.length === 10) {
        onChange?.({ target: { value: iso } });
      }
    } else if (formatted.length === 0) {
      onChange?.({ target: { value: "" } });
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      if (value) {
        onChange?.({ target: { value: "" } });
      }
      return;
    }
    const iso = usToISO(text);
    if (iso && iso.length === 10) {
      setText(isoToUS(iso));
      if (iso !== value) {
        onChange?.({ target: { value: iso } });
      }
    } else {
      // Revert if incomplete/invalid
      setText(isoToUS(value));
    }
  };

  const handleOpenPicker = () => {
    if (disabled) return;
    if (hiddenInputRef.current) {
      try {
        if (typeof hiddenInputRef.current.showPicker === "function") {
          hiddenInputRef.current.showPicker();
        } else {
          hiddenInputRef.current.focus();
        }
      } catch {
        hiddenInputRef.current.focus();
      }
    }
  };

  const handleHiddenPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    setText(isoToUS(iso));
    onChange?.({ target: { value: iso } });
  };

  const isoMin = min ? usToISO(min) : undefined;
  const isoMax = max ? usToISO(max) : undefined;
  const isoCurrent = value ? usToISO(value) : "";

  const { marginBottom, margin, width, flex, ...inputStyle } = style;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: width || "100%",
        marginBottom: marginBottom,
        margin: margin,
        flex: flex,
        boxSizing: "border-box",
      }}
    >
      <input
        type="text"
        id={id}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        title={title || "Format: mm/dd/yyyy"}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className={className}
        style={{
          boxSizing: "border-box",
          width: "100%",
          ...inputStyle,
          margin: 0,
          marginBottom: 0,
          paddingRight: "34px",
        }}
      />

      {/* Calendar Icon Button */}
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled}
        title="Choose date from calendar"
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: "4px",
          cursor: disabled ? "not-allowed" : "pointer",
          color: disabled ? "#94a3b8" : "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          outline: "none",
        }}
      >
        <FaCalendarAlt style={{ fontSize: "14px" }} />
      </button>

      {/* Hidden native date input to provide the native calendar popup */}
      <input
        type="date"
        ref={hiddenInputRef}
        value={isoCurrent}
        min={isoMin}
        max={isoMax}
        onChange={handleHiddenPickerChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          right: "8px",
          width: "20px",
          height: "20px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </div>
  );
};

export default EnglishDateInput;
