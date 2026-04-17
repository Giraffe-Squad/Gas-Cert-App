import { useState, useRef, useEffect, useMemo, createContext, useContext, useCallback } from 'react';
import { ChevronDown, AlertTriangle, CheckCircle2, XCircle, Info, Search, X, UserCheck } from 'lucide-react';
import { COLORS } from './data';

/* ═══════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════ */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none",
      }}>
        {toasts.map(toast => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          return (
            <div key={toast.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 18px", borderRadius: 12,
              border: `1.5px solid ${isSuccess ? COLORS.green : isError ? COLORS.red : COLORS.amber}`,
              background: isSuccess ? COLORS.greenBg : isError ? COLORS.redBg : COLORS.amberBg,
              color: isSuccess ? COLORS.green : isError ? COLORS.red : COLORS.amber,
              boxShadow: "0 6px 20px rgba(0,0,0,.12)",
              pointerEvents: "auto", fontFamily: "'Outfit', sans-serif",
              minWidth: 240, animation: "toastSlideIn 0.3s ease-out",
            }}>
              {isSuccess ? <CheckCircle2 size={18} /> : isError ? <XCircle size={18} /> : <Info size={18} />}
              <span style={{ fontSize: 14, fontWeight: 500 }}>{toast.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/* ═══════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════ */
export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: 30,
        maxWidth: 400, width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,.2)",
        animation: "scaleIn 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <AlertTriangle size={24} color={COLORS.red} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.primary, margin: 0 }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: "10px 22px", borderRadius: 10,
            border: `1.5px solid ${COLORS.border}`, background: "transparent",
            color: COLORS.muted, fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "10px 22px", borderRadius: 10,
            border: "none", background: COLORS.red, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMBO BOX — dropdown with search + manual input
   ═══════════════════════════════════════════════════════════════ */
export function ComboBox({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef(null);

  const filtered = useMemo(() => {
    const query = (searchText || value || "").toLowerCase();
    return query ? options.filter(o => o.toLowerCase().includes(query)) : options;
  }, [searchText, value, options]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          value={searchText !== "" ? searchText : value}
          onChange={e => {
            setSearchText(e.target.value);
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => { setIsOpen(true); setSearchText(""); }}
          placeholder={placeholder}
          style={componentStyles.input}
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          tabIndex={-1}
          style={{
            position: "absolute", right: 10, background: "transparent",
            border: "none", color: COLORS.muted, cursor: "pointer",
            padding: 2, display: "flex",
          }}
        >
          <ChevronDown size={14} />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <div style={componentStyles.dropdown}>
          {filtered.slice(0, 15).map(option => (
            <div
              key={option}
              onClick={() => { onChange(option); setSearchText(""); setIsOpen(false); }}
              style={{
                padding: "10px 14px", fontSize: 13, cursor: "pointer",
                borderBottom: `1px solid ${COLORS.border}30`,
                background: value === option ? COLORS.accentBg : "transparent",
                fontWeight: value === option ? 600 : 400,
              }}
              onMouseEnter={e => { if (value !== option) e.target.style.background = '#f5f7fa'; }}
              onMouseLeave={e => { e.target.style.background = value === option ? COLORS.accentBg : "transparent"; }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRI-STATE BUTTONS — Yes/No/N/A or Pass/Fail/N/A
   ═══════════════════════════════════════════════════════════════ */
export function TriStateButtons({ value, onChange, options = ["Yes", "No", "N/A"] }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {options.map(option => {
        const isActive = value === option;
        const isPositive = option === "Yes" || option === "Pass";
        const isNegative = option === "No" || option === "Fail";
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1.5px solid",
              fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              fontFamily: "'Outfit', sans-serif", fontWeight: isActive ? 700 : 400,
              background: isActive
                ? (isPositive ? COLORS.greenBg : isNegative ? COLORS.redBg : COLORS.accentBg)
                : "#fff",
              color: isActive
                ? (isPositive ? COLORS.green : isNegative ? COLORS.red : COLORS.accent)
                : COLORS.muted,
              borderColor: isActive
                ? (isPositive ? "#81c784" : isNegative ? "#ef9a9a" : COLORS.accent)
                : COLORS.border,
              transform: isActive ? "scale(1.04)" : "scale(1)",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM FIELD WRAPPER
   ═══════════════════════════════════════════════════════════════ */
export function FormField({ label, required, half, third, children }) {
  return (
    <div style={{
      flex: third ? "1 1 30%" : half ? "1 1 47%" : "1 1 100%",
      minWidth: third ? 120 : half ? 180 : 0,
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      <label style={componentStyles.label}>
        {label}
        {required && <span style={{ color: COLORS.red, marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════ */
export function SectionHeader({ title, icon: Icon }) {
  return (
    <div style={componentStyles.sectionHeader}>
      {Icon && <Icon size={14} />}
      {title}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP TITLE
   ═══════════════════════════════════════════════════════════════ */
export function StepTitle({ title, description, icon: Icon }) {
  return (
    <div style={{ marginBottom: 22, display: "flex", gap: 14, alignItems: "flex-start" }}>
      {Icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: COLORS.accentBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: COLORS.accent, flexShrink: 0,
        }}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <h2 style={{ fontSize: 21, fontWeight: 700, color: COLORS.primary, marginBottom: 4, letterSpacing: -0.3 }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CHOOSE EXISTING — picks from previously saved entries
   ═══════════════════════════════════════════════════════════════ */
export function ChooseExisting({ storageKey, labelField, secondaryField, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const containerRef = useRef(null);

  const items = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }, [storageKey, isOpen]); // Re-read when opened

  const filtered = useMemo(() => {
    if (!searchText.trim()) return items;
    const q = searchText.toLowerCase();
    return items.filter(item => {
      const label = (item[labelField] || "").toLowerCase();
      const secondary = (item[secondaryField] || "").toLowerCase();
      return label.includes(q) || secondary.includes(q);
    });
  }, [items, searchText, labelField, secondaryField]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (items.length === 0 && !isOpen) {
    return (
      <div style={{ marginBottom: 14 }}>
        <button type="button" disabled style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 10,
          border: `1.5px solid ${COLORS.border}`,
          background: "#fff", color: COLORS.border,
          fontSize: 13, fontWeight: 600, cursor: "default",
          fontFamily: "'Outfit', sans-serif",
          width: "100%", justifyContent: "center", opacity: 0.6,
        }}>
          <UserCheck size={16} />
          No saved entries yet
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 10,
          border: `1.5px solid ${isOpen ? COLORS.accent : COLORS.border}`,
          background: isOpen ? COLORS.accentBg : "#fff",
          color: isOpen ? COLORS.accent : COLORS.muted,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
          fontFamily: "'Outfit', sans-serif", transition: "all 0.2s",
          width: "100%", justifyContent: "center",
        }}
      >
        <UserCheck size={16} />
        {isOpen ? "Close" : `Choose from existing (${items.length})`}
      </button>

      {isOpen && (
        <div style={{
          marginTop: 8, borderRadius: 12,
          border: `1.5px solid ${COLORS.border}`,
          background: "#fff", boxShadow: "0 8px 28px rgba(0,0,0,.1)",
          overflow: "hidden",
        }}>
          {/* Search bar */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color={COLORS.muted} style={{ position: "absolute", left: 10, top: 10 }} />
              <input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search existing entries..."
                style={{
                  ...componentStyles.input,
                  paddingLeft: 32, fontSize: 13, padding: "8px 10px 8px 32px",
                }}
                autoFocus
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  style={{
                    position: "absolute", right: 8, top: 8,
                    background: "transparent", border: "none",
                    cursor: "pointer", color: COLORS.muted,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: COLORS.muted, fontSize: 13 }}>
                No matching entries found.
              </div>
            )}
            {filtered.map((item, index) => (
              <div
                key={index}
                onClick={() => { onSelect(item); setIsOpen(false); setSearchText(""); }}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: `1px solid ${COLORS.border}20`,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.target.style.background = COLORS.accentBg}
                onMouseLeave={e => e.target.style.background = "transparent"}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.primary }}>
                  {item[labelField] || "Unnamed"}
                </div>
                {item[secondaryField] && (
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    {item[secondaryField]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Saves an entry to the "existing entries" storage for a section
 */
export function saveExistingEntry(storageKey, entry, identifierField) {
  try {
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    // Don't duplicate — check by identifier
    const identifier = entry[identifierField];
    if (!identifier) return;
    const existingIndex = existing.findIndex(e => e[identifierField] === identifier);
    if (existingIndex >= 0) {
      existing[existingIndex] = { ...entry }; // Update
    } else {
      existing.unshift(entry); // Add to front
    }
    // Keep max 50 entries
    localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 50)));
  } catch {
    // Storage full
  }
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT STYLES
   ═══════════════════════════════════════════════════════════════ */
export const componentStyles = {
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 9,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.inputBg,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: "'Outfit', sans-serif",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.text,
    letterSpacing: 0.15,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottom: `2px solid ${COLORS.accentBg}`,
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 50,
    background: "#fff",
    borderRadius: 12,
    marginTop: 4,
    border: `1.5px solid ${COLORS.border}`,
    boxShadow: "0 10px 32px rgba(0,0,0,.12)",
    maxHeight: 260,
    overflowY: "auto",
  },
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES (CSS animations)
   ═══════════════════════════════════════════════════════════════ */
export function GlobalStyles() {
  return (
    <style>{`
      @keyframes toastSlideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes slideInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes slideInLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      input:focus, textarea:focus, select:focus {
        border-color: ${COLORS.accent} !important;
        box-shadow: 0 0 0 3px ${COLORS.accent}18 !important;
        outline: none;
      }
      button { transition: all 0.15s ease; font-family: 'Outfit', sans-serif; }
      button:hover { filter: brightness(1.06); }
      button:active { transform: scale(0.97) !important; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-thumb { background: #d0d5db; border-radius: 3px; }
    `}</style>
  );
}
