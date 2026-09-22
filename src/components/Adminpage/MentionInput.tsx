import React, { useState, useRef, useEffect } from "react";
import type { SubadminUser } from "../../lib/api";

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  users: SubadminUser[];
  rows?: number;
  isSingleLine?: boolean;
  onEnterSubmit?: () => void;
  inputStyle?: React.CSSProperties;
  className?: string;
  autoFocus?: boolean;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "Add a comment (type @ to mention someone)...",
  users,
  rows = 3,
  isSingleLine = false,
  onEnterSubmit,
  inputStyle = {},
  className = "",
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Handle text change and detect @
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = newVal.slice(0, cursorPos);

    // Look for the last '@' symbol before cursor that isn't preceded by non-space
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (
      lastAtIndex !== -1 &&
      (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))
    ) {
      const mentionText = textBeforeCursor.slice(lastAtIndex + 1);
      // Check that mention text doesn't contain spaces or newline
      if (!/[\s\n]/.test(mentionText)) {
        setQuery(mentionText);
        setMentionStartIndex(lastAtIndex);
        setIsOpen(true);
        setSelectedIndex(0);
        return;
      }
    }

    setIsOpen(false);
  };

  // Insert selected user tag
  const insertMention = (user: SubadminUser) => {
    if (mentionStartIndex === -1 || !inputRef.current) return;

    const cursorPos = inputRef.current.selectionStart || value.length;
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterCursor = value.slice(cursorPos);
    const mentionTag = `@${user.name} `;

    const updatedValue = `${beforeMention}${mentionTag}${afterCursor}`;
    onChange(updatedValue);
    setIsOpen(false);

    // Re-focus and position cursor right after the inserted mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = mentionStartIndex + mentionTag.length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  // Key navigation in autocomplete menu
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (isOpen && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && isSingleLine && !isOpen) {
      e.preventDefault();
      onEnterSubmit?.();
    }
  };

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {isSingleLine ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          style={inputStyle}
          autoFocus={autoFocus}
        />
      ) : (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={className}
          style={inputStyle}
          autoFocus={autoFocus}
        />
      )}

      {/* AUTOCOMPLETE POPUP MENU */}
      {isOpen && filteredUsers.length > 0 && (
        <div
          ref={menuRef}
          className="mention-autocomplete-menu"
          style={{
            position: "absolute",
            bottom: isSingleLine ? "100%" : "calc(100% - 6px)",
            left: "8px",
            zIndex: 9999,
            background: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(0,0,0,0.05)",
            width: "280px",
            maxHeight: "220px",
            overflowY: "auto",
            padding: "6px",
          }}
        >
          <div
            style={{
              padding: "4px 8px 6px 8px",
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#94a3b8",
              borderBottom: "1px solid #f1f5f9",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Tag user (@)</span>
            <span style={{ fontSize: "10px", fontWeight: 600 }}>↑↓ to navigate · ↵ select</span>
          </div>

          {filteredUsers.map((user, idx) => {
            const isHighlighted = idx === selectedIndex;
            const initials = user.name
              ? user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "U";

            return (
              <div
                key={user._id}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "7px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  background: isHighlighted ? "#eff6ff" : "transparent",
                  color: isHighlighted ? "#1d4ed8" : "#334155",
                  transition: "background 0.1s ease",
                }}
              >
                {/* User avatar initial */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: isHighlighted ? "#3b82f6" : "#f1f5f9",
                    color: isHighlighted ? "#ffffff" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background:
                          user.role === "admin"
                            ? "#fee2e2"
                            : user.role === "subadmin"
                            ? "#fef3c7"
                            : "#f1f5f9",
                        color:
                          user.role === "admin"
                            ? "#dc2626"
                            : user.role === "subadmin"
                            ? "#b45309"
                            : "#64748b",
                        textTransform: "uppercase",
                      }}
                    >
                      {user.role || "user"}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
