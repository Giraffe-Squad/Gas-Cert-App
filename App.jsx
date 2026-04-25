import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import {
  User, Building2, Home, Flame, Wrench, AlertTriangle, PenTool, Send,
  ChevronDown, ChevronLeft, ChevronRight, Plus, Check, Trash2, Shield,
  FileText, Download, CheckCircle2, XCircle, ClipboardCheck,
  FolderOpen, FilePlus, Calendar, Search, X, Settings, LogOut, Key,
  Edit3, MapPin, LayoutGrid, List, Loader2, RefreshCw, CloudOff, Cloud,
  Mail, Receipt,
} from 'lucide-react';

import {
  COLORS, APPLIANCE_DATA, FORM_STEPS, createEmptyAppliance,
  createEmptyCertificate, loadFromStorage, saveToStorage,
  MASTER_KEY, APP_VERSION,
} from './data';

import {
  fetchCertificates, upsertCertificate, deleteCertificate,
  migrateLocalCertificates,
} from './certificateService';

import { generateCertificatePDF } from './generatePDF';
import { emailCertificate } from './emailService';
import LoginPage, { AppLogo } from './LoginPage';
import InvoiceApp from './InvoiceApp';
import {
  ToastProvider, useToast, ConfirmDialog, ComboBox, TriStateButtons,
  FormField, SectionHeader, StepTitle, ChooseExisting, saveExistingEntry,
  GlobalStyles, componentStyles,
} from './components';

const STEP_ICONS = { 1: User, 2: Home, 3: Building2, 4: Flame, 5: Wrench, 6: AlertTriangle, 7: PenTool, 8: Send };

/* ═══════════════════════════════════════════════════════════════
   APPLIANCE CARD
   ═══════════════════════════════════════════════════════════════ */
function ApplianceCard({ appliance, index, onUpdate, onRemove, canRemove }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const update = (field, value) => onUpdate(appliance.id, field, value);

  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${isExpanded ? COLORS.accent + "50" : COLORS.border}`, marginBottom: 12, background: "#fff", overflow: "hidden", transition: "border-color 0.25s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer", userSelect: "none" }} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.accentBg, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{index + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.primary }}>{appliance.type || "New Appliance"}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>{[appliance.location, appliance.make, appliance.model].filter(Boolean).join(" · ") || "Tap to expand"}</div>
        </div>
        {appliance.appSafeToUse && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: appliance.appSafeToUse === "Yes" ? COLORS.greenBg : COLORS.redBg, color: appliance.appSafeToUse === "Yes" ? COLORS.green : COLORS.red }}>{appliance.appSafeToUse === "Yes" ? "SAFE" : "UNSAFE"}</span>}
        <ChevronDown size={18} color={COLORS.muted} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s" }} />
        {canRemove && <button onClick={e => { e.stopPropagation(); onRemove(appliance.id); }} style={{ background: "transparent", border: "none", color: COLORS.red, cursor: "pointer", padding: 4, opacity: 0.5 }} type="button"><Trash2 size={16} /></button>}
      </div>
      {isExpanded && (
        <div style={{ padding: "16px 18px 20px", borderTop: `1px solid ${COLORS.border}`, animation: "fadeIn 0.25s ease" }}>
          <SectionHeader title="Appliance Identification" icon={ClipboardCheck} />
          <div style={appS.grid}>
            <FormField label="Location" required half><ComboBox value={appliance.location} onChange={v => update("location", v)} options={APPLIANCE_DATA.locations} placeholder="e.g. Kitchen" /></FormField>
            <FormField label="Type" required half><ComboBox value={appliance.type} onChange={v => update("type", v)} options={APPLIANCE_DATA.types} placeholder="e.g. Combination Boiler" /></FormField>
            <FormField label="Make" half><ComboBox value={appliance.make} onChange={v => update("make", v)} options={APPLIANCE_DATA.makes} placeholder="e.g. Vaillant" /></FormField>
            <FormField label="Model" half><input style={componentStyles.input} value={appliance.model} onChange={e => update("model", e.target.value)} placeholder="e.g. Ecotec Plus 824" /></FormField>
            <FormField label="Flue Type" half>
              <select style={{ ...componentStyles.input, color: appliance.flueType ? COLORS.text : COLORS.muted }} value={appliance.flueType} onChange={e => update("flueType", e.target.value)}>
                <option value="">Select flue type...</option>
                {APPLIANCE_DATA.flueTypes.map(f => <option key={f.code} value={f.code}>{f.label}</option>)}
              </select>
            </FormField>
            <FormField label="Operating Pressure (mBar) / Heat Input (kW/h)" half><input style={componentStyles.input} value={appliance.operatingPressure} onChange={e => update("operatingPressure", e.target.value)} placeholder="e.g. 19 mBar" /></FormField>
          </div>
          <SectionHeader title="Flue Tests" icon={Shield} />
          <div style={appS.checkGrid}>
            <FormField label="Safety Devices Correct Operation"><TriStateButtons value={appliance.safetyDevices} onChange={v => update("safetyDevices", v)} /></FormField>
            <FormField label="Spillage Test"><TriStateButtons value={appliance.spillageTest} onChange={v => update("spillageTest", v)} options={["Pass", "Fail", "N/A"]} /></FormField>
            <FormField label="Smoke Pellet Flue Flow Test"><TriStateButtons value={appliance.smokePelletTest} onChange={v => update("smokePelletTest", v)} options={["Pass", "Fail", "N/A"]} /></FormField>
          </div>
          <SectionHeader title="Combustion Analyser — Initial (Low) Reading" />
          <div style={appS.grid}>
            <FormField label="Ratio" third><input style={componentStyles.input} value={appliance.initRatio} onChange={e => update("initRatio", e.target.value)} placeholder="e.g. 0.0006" /></FormField>
            <FormField label="CO (PPM)" third><input style={componentStyles.input} value={appliance.initCO} onChange={e => update("initCO", e.target.value)} placeholder="CO ppm" /></FormField>
            <FormField label="CO₂ (%)" third><input style={componentStyles.input} value={appliance.initCO2} onChange={e => update("initCO2", e.target.value)} placeholder="CO₂ %" /></FormField>
          </div>
          <SectionHeader title="Combustion Analyser — Final (High) Reading" />
          <div style={appS.grid}>
            <FormField label="Ratio" third><input style={componentStyles.input} value={appliance.finalRatio} onChange={e => update("finalRatio", e.target.value)} placeholder="e.g. 0.0006" /></FormField>
            <FormField label="CO (PPM)" third><input style={componentStyles.input} value={appliance.finalCO} onChange={e => update("finalCO", e.target.value)} placeholder="CO ppm" /></FormField>
            <FormField label="CO₂ (%)" third><input style={componentStyles.input} value={appliance.finalCO2} onChange={e => update("finalCO2", e.target.value)} placeholder="CO₂ %" /></FormField>
          </div>
          <SectionHeader title="Inspection Details" icon={ClipboardCheck} />
          <div style={appS.checkGrid}>
            <FormField label="Satisfactory Termination"><TriStateButtons value={appliance.satTermination} onChange={v => update("satTermination", v)} /></FormField>
            <FormField label="Flue Visual Condition"><TriStateButtons value={appliance.flueVisual} onChange={v => update("flueVisual", v)} options={["Pass", "Fail", "N/A"]} /></FormField>
            <FormField label="Adequate Ventilation"><TriStateButtons value={appliance.adequateVent} onChange={v => update("adequateVent", v)} /></FormField>
            <FormField label="Landlord's Appliance"><TriStateButtons value={appliance.landlordsAppliance} onChange={v => update("landlordsAppliance", v)} /></FormField>
            <FormField label="Inspected"><TriStateButtons value={appliance.inspected} onChange={v => update("inspected", v)} /></FormField>
            <FormField label="Appliance Visual Check"><TriStateButtons value={appliance.appVisualCheck} onChange={v => update("appVisualCheck", v)} /></FormField>
            <FormField label="Appliance Serviced"><TriStateButtons value={appliance.appServiced} onChange={v => update("appServiced", v)} /></FormField>
            <FormField label="Appliance Safe to Use" required><TriStateButtons value={appliance.appSafeToUse} onChange={v => update("appSafeToUse", v)} /></FormField>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PAGE
   ═══════════════════════════════════════════════════════════════ */
function SettingsPage({ onClose, userName, setUserName }) {
  const toast = useToast();
  const [masterKey, setMasterKey] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [localName, setLocalName] = useState(userName || "");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 440, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,.2)", animation: "scaleIn 0.2s ease", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Settings size={22} color={COLORS.accent} /><h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, margin: 0 }}>Settings</h2></div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted, padding: 4 }}><X size={20} /></button>
        </div>
        <div style={{ marginBottom: 22, padding: "16px 18px", borderRadius: 14, background: COLORS.inputBg, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><User size={16} color={COLORS.accent} /><span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.8 }}>Your Name</span></div>
          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 10 }}>Shown on the dashboard welcome screen.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={localName} onChange={e => setLocalName(e.target.value)} placeholder="e.g. Abdullah" style={{ ...componentStyles.input, flex: 1 }} onKeyDown={e => { if (e.key === "Enter") { setUserName(localName.trim()); toast("Name saved!", "success"); }}} />
            <button onClick={() => { setUserName(localName.trim()); toast("Name saved!", "success"); }} style={{ ...appS.accentBtn, padding: "10px 18px", whiteSpace: "nowrap" }}><Check size={16} /> Save</button>
          </div>
        </div>
        <div style={{ height: 1, background: COLORS.border, margin: "0 0 20px" }} />
        {!unlocked ? (
          <div>
            <p style={{ fontSize: 14, color: COLORS.muted, marginBottom: 16 }}>Enter master key to change login credentials.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              <label style={componentStyles.label}>Master Key</label>
              <input type="password" value={masterKey} onChange={e => setMasterKey(e.target.value)} placeholder="Enter master key" style={componentStyles.input} onKeyDown={e => { if (e.key === "Enter") { if (masterKey === MASTER_KEY) { setUnlocked(true); toast("Unlocked", "success"); } else toast("Invalid", "error"); }}} />
            </div>
            <button onClick={() => { if (masterKey === MASTER_KEY) { setUnlocked(true); toast("Unlocked", "success"); } else toast("Invalid key", "error"); }} style={appS.accentBtn}><Key size={16} /> Unlock</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: COLORS.green, fontWeight: 600, marginBottom: 16 }}>✓ Unlocked</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={componentStyles.label}>New Username</label><input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="New username" style={componentStyles.input} /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><label style={componentStyles.label}>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" style={componentStyles.input} /></div>
              <button onClick={() => { if (!newUsername.trim() || !newPassword.trim()) { toast("Both required", "error"); return; } saveToStorage("cp12_username", newUsername.trim()); saveToStorage("cp12_password", newPassword); toast("Saved!", "success"); setNewUsername(""); setNewPassword(""); setUnlocked(false); setMasterKey(""); }} style={appS.accentBtn}><Check size={16} /> Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYNC STATUS BADGE
   ═══════════════════════════════════════════════════════════════ */
function SyncBadge({ status }) {
  if (status === "synced") return (
    <span title="Synced to cloud" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.green, fontWeight: 600 }}>
      <Cloud size={13} /> Synced
    </span>
  );
  if (status === "syncing") return (
    <span title="Saving…" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.accent, fontWeight: 600 }}>
      <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…
    </span>
  );
  return (
    <span title="Sync error — changes saved locally" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.red, fontWeight: 600 }}>
      <CloudOff size={13} /> Offline
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
function AppContent() {
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [certificates, setCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [activeCert, setActiveCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [certViewMode, setCertViewMode] = useState("card");
  const [userName, setUserName] = useState(() => loadFromStorage("cp12_user_name", ""));
  const [syncStatus, setSyncStatus] = useState("synced");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Supabase auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
      if (session && _event === 'SIGNED_IN') toast("Welcome back!", "success");
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Fetch certificates from Supabase when session is available ───
  useEffect(() => {
    if (!session) {
      setCertificates([]);
      setCertsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCerts() {
      setCertsLoading(true);

      // Always start with localStorage so user sees their data instantly
      const localCerts = loadFromStorage("cp12_certs", []);
      if (localCerts.length > 0 && !cancelled) {
        setCertificates(localCerts);
      }

      try {
        // Try to migrate localStorage → Supabase (one-time)
        const migrated = await migrateLocalCertificates();
        if (migrated > 0 && !cancelled) {
          toast(`Migrated ${migrated} certificate${migrated > 1 ? 's' : ''} to cloud`, "success");
        }

        // Fetch all from Supabase
        const cloudCerts = await fetchCertificates();
        if (!cancelled) {
          if (cloudCerts.length > 0) {
            // Cloud has data — use it as source of truth
            setCertificates(cloudCerts);
            setSyncStatus("synced");
          } else if (localCerts.length > 0) {
            // Cloud is empty but local has data — try pushing it up
            setSyncStatus("syncing");
            let pushed = 0;
            for (const c of localCerts) {
              try { await upsertCertificate(c); pushed++; } catch (e) { console.error("Push failed:", c.id, e); }
            }
            setCertificates(localCerts);
            setSyncStatus(pushed > 0 ? "synced" : "error");
            if (pushed > 0) toast(`Synced ${pushed} certificate${pushed > 1 ? 's' : ''} to cloud`, "success");
          } else {
            // Both empty — fresh start
            setCertificates([]);
            setSyncStatus("synced");
          }
        }
      } catch (err) {
        console.error("Failed to load certificates:", err);
        if (!cancelled) {
          // Keep whatever we loaded from localStorage
          if (localCerts.length > 0) {
            setCertificates(localCerts);
          }
          setSyncStatus("error");
          toast("Using local data — cloud sync failed", "error");
        }
      } finally {
        if (!cancelled) { setCertsLoading(false); setInitialLoadDone(true); }
      }
    }

    loadCerts();
    return () => { cancelled = true; };
  }, [session]);

  // Keep local backup of certificates (safety net)
  // Only save after initial load is done to avoid wiping localStorage during startup
  useEffect(() => {
    if (initialLoadDone) {
      saveToStorage("cp12_certs", certificates);
    }
  }, [certificates, initialLoadDone]);

  useEffect(() => { saveToStorage("cp12_user_name", userName); }, [userName]);

  useEffect(() => {
    if (activeCert?.inspDate) {
      const d = new Date(activeCert.inspDate);
      d.setFullYear(d.getFullYear() + 1);
      updateField("nextDate", d.toISOString().slice(0, 10));
    }
  }, [activeCert?.inspDate]);

  const filteredCerts = useMemo(() => {
    const rev = [...certificates].reverse();
    if (!searchQuery.trim()) return rev;
    const q = searchQuery.toLowerCase();
    return rev.filter(c =>
      (c.prop?.address || "").toLowerCase().includes(q) ||
      (c.prop?.postcode || "").toLowerCase().includes(q) ||
      (c.ll?.name || "").toLowerCase().includes(q) ||
      (c.ll?.address || "").toLowerCase().includes(q) ||
      (c.eng?.company || "").toLowerCase().includes(q) ||
      (c.eng?.name || "").toLowerCase().includes(q) ||
      (c.certNo || "").toLowerCase().includes(q)
    );
  }, [certificates, searchQuery]);

  // ─── Refresh — NEVER wipes local data ───
  const refreshCerts = useCallback(async () => {
    if (!session) return;
    try {
      setSyncStatus("syncing");
      const cloudCerts = await fetchCertificates();

      if (cloudCerts.length > 0) {
        // Cloud has data — use it
        setCertificates(cloudCerts);
        setSyncStatus("synced");
        toast("Synced from cloud", "success");
      } else if (certificates.length > 0) {
        // Cloud empty but we have local data — try pushing local up
        setSyncStatus("syncing");
        let pushed = 0;
        for (const cert of certificates) {
          try {
            await upsertCertificate(cert);
            pushed++;
          } catch (e) {
            console.error("Failed to push cert:", cert.id, e);
          }
        }
        if (pushed > 0) {
          setSyncStatus("synced");
          toast(`Pushed ${pushed} certificate${pushed > 1 ? 's' : ''} to cloud`, "success");
        } else {
          setSyncStatus("error");
          toast("Could not sync to cloud", "error");
        }
      } else {
        setSyncStatus("synced");
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      setSyncStatus("error");
      toast("Sync failed — your data is safe locally", "error");
    }
  }, [session, certificates]);

  // Auth
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={36} color={COLORS.accent} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: 16, color: COLORS.muted, fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );
  if (!session) return <LoginPage />;

  // ─── Actions ───
  const startNew = () => {
    const newCert = createEmptyCertificate();
    const existingNums = certificates.map(c => {
      const match = (c.certNo || '').match(/CP12-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    newCert.certNo = 'CP12-' + String(nextNum).padStart(4, '0');
    setActiveCert(newCert);
    setCurrentStep(1);
    setSlideDirection(0);
    setSlideKey(0);
    setCurrentView("form");
  };

  const openCert = (cert, editMode = false) => {
    setActiveCert({ ...cert });
    setCurrentStep(editMode ? 1 : 8);
    setCurrentView("form");
  };

  const saveCert = async (status = "draft") => {
    if (!activeCert) return;
    const updated = { ...activeCert, status, updatedAt: new Date().toISOString() };

    // Optimistic local update
    setCertificates(prev => {
      const idx = prev.findIndex(c => c.id === updated.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
      return [...prev, updated];
    });
    setActiveCert(updated);

    // Save to localStorage autocomplete
    if (updated.eng.name) saveExistingEntry("cp12_existing_engineers", updated.eng, "name");
    if (updated.prop.address) saveExistingEntry("cp12_existing_properties", updated.prop, "address");
    if (updated.ll.name) saveExistingEntry("cp12_existing_landlords", updated.ll, "name");

    // Persist to Supabase
    setSyncStatus("syncing");
    try {
      await upsertCertificate(updated);
      setSyncStatus("synced");
      toast(status === "complete" ? "Certificate saved!" : "Draft saved", "success");
    } catch (err) {
      console.error("Save to cloud failed:", err);
      setSyncStatus("error");
      // Data is safe in local state + localStorage backup
      toast(status === "complete" ? "Certificate saved locally" : "Draft saved locally", "info");
    }
  };

  const confirmDel = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget;
    setDeleteTarget(null);

    // Optimistic local removal
    const remaining = certificates.filter(c => c.id !== targetId);
    setCertificates(remaining);

    // Immediately clear localStorage so ghost certs can't come back
    saveToStorage("cp12_certs", remaining);

    // Delete from Supabase
    setSyncStatus("syncing");
    try {
      await deleteCertificate(targetId);
      setSyncStatus("synced");
      toast("Deleted", "info");
    } catch (err) {
      console.error("Delete from cloud failed:", err);
      setSyncStatus("error");
      toast("Deleted locally", "info");
    }
  };

  const dlPDF = (cert) => { try { generateCertificatePDF(cert); } catch (err) { console.error(err); toast("PDF failed", "error"); } };

  // ─── Email certificate PDF ───
  const sendCertEmail = async (cert) => {
    const emails = [cert.ll?.email, cert.eng?.email].filter(Boolean);
    if (emails.length === 0) { toast("No email addresses on this certificate", "error"); return; }
    setEmailSending(true);
    try {
      const pdfDoc = generateCertificatePDF(cert, false);
      const result = await emailCertificate(cert, pdfDoc);
      if (result.success) toast(result.message, "success");
      else toast(result.message, "error");
    } catch (err) {
      console.error(err);
      toast("Email failed — check console", "error");
    } finally {
      setEmailSending(false);
    }
  };

  // Form helpers
  const updateField = (path, val) => {
    if (!activeCert) return;
    setActiveCert(prev => {
      const n = { ...prev };
      const p = path.split(".");
      if (p.length === 2) n[p[0]] = { ...n[p[0]], [p[1]]: val };
      else n[p[0]] = val;
      return n;
    });
  };
  const updateApp = (id, f, v) => setActiveCert(prev => ({ ...prev, apps: prev.apps.map(a => a.id === id ? { ...a, [f]: v } : a) }));
  const removeApp = (id) => { setActiveCert(prev => ({ ...prev, apps: prev.apps.filter(a => a.id !== id) })); toast("Removed", "info"); };
  const addApp = () => { setActiveCert(prev => ({ ...prev, apps: [...prev.apps, createEmptyAppliance()] })); toast("Added", "success"); };
  const navStep = (d) => { setSlideDirection(d); setSlideKey(k => k + 1); setCurrentStep(s => Math.max(1, Math.min(8, s + d))); };

  const cert = activeCert || createEmptyCertificate();
  const isOverallSafe = cert.apps.length > 0 && cert.apps.every(a => a.appSafeToUse === "Yes");

  /* ═════ INVOICES VIEW ═════ */
  if (currentView === "invoices") {
    return (
      <>
        <GlobalStyles />
        <InvoiceApp onBack={() => setCurrentView("dashboard")} session={session} />
      </>
    );
  }

  /* ═════ DASHBOARD ═════ */
  if (currentView === "dashboard") {
    return (
      <div style={appS.root}><GlobalStyles /><div style={appS.bgDots} />
        <div style={appS.container}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, animation: "fadeIn 0.5s ease" }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: COLORS.primary, margin: 0, letterSpacing: -0.8 }}>Welcome{userName ? ` ${userName.split(" ")[0]}` : ""}</h1>
              <p style={{ fontSize: 14, color: COLORS.muted, margin: "6px 0 0 0", fontWeight: 500 }}>What would you like to do today?</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setShowSettings(true)} title="Settings" style={appS.iconBtn}><Settings size={18} /></button>
              <button onClick={handleLogout} title="Log out" style={appS.iconBtn}><LogOut size={18} /></button>
            </div>
          </div>

          <button onClick={startNew} className="cp12-primary-btn" type="button">
            <span className="cp12-btn-circle" aria-hidden="true"></span>
            <span className="cp12-btn-content">
              <FilePlus size={24} strokeWidth={2.5} />
              <span>Create New Certificate</span>
            </span>
            <ChevronRight size={22} strokeWidth={3} className="cp12-btn-arrow" aria-hidden="true" />
          </button>

          <button onClick={() => setCurrentView("certificates")} className="cp12-secondary-card" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 20, borderRadius: 16,
            background: COLORS.card, border: `1.5px solid ${COLORS.border}`, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderOpen size={24} color={COLORS.accent} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.primary }}>Completed Certificates</div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>
                  {certsLoading ? "Loading…" : `${certificates.length} certificate${certificates.length !== 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
            <ChevronRight size={22} color={COLORS.muted} />
          </button>

          {/* ─── Invoice Button (NEW) ─── */}
          <button onClick={() => setCurrentView("invoices")} className="cp12-secondary-card" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: 20, borderRadius: 16,
            background: COLORS.card, border: `1.5px solid ${COLORS.border}`, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,.04)", marginTop: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={24} color={COLORS.accent} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.primary }}>Invoices</div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>Plumbing & gas invoices</div>
              </div>
            </div>
            <ChevronRight size={22} color={COLORS.muted} />
          </button>

          {/* Sync status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 10 }}>
            <SyncBadge status={syncStatus} />
            {syncStatus === "error" && (
              <button onClick={refreshCerts} style={{ background: "transparent", border: "none", cursor: "pointer", color: COLORS.accent, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                <RefreshCw size={12} /> Retry
              </button>
            )}
          </div>
        </div>
        {showSettings && <SettingsPage onClose={() => setShowSettings(false)} userName={userName} setUserName={setUserName} />}
      </div>
    );
  }

  /* ═════ CERTIFICATES VIEW ═════ */
  if (currentView === "certificates") {
    return (
      <div style={appS.root}><GlobalStyles /><div style={appS.bgDots} />
        <div style={appS.container}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={() => setCurrentView("dashboard")} style={{ ...appS.iconBtn, padding: 8 }}><ChevronLeft size={20} /></button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, margin: 0 }}>Completed Certificates</h1>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
                {certsLoading ? "Loading…" : `${certificates.length} total`}
              </p>
            </div>
            <SyncBadge status={syncStatus} />
            <button onClick={refreshCerts} title="Refresh from cloud" style={{ ...appS.iconBtn, padding: 6 }}>
              <RefreshCw size={15} style={syncStatus === "syncing" ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
            <div style={{ display: "flex", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setCertViewMode("card")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: certViewMode === "card" ? COLORS.accent : "#fff", color: certViewMode === "card" ? "#fff" : COLORS.muted, display: "flex" }}><LayoutGrid size={16} /></button>
              <button onClick={() => setCertViewMode("list")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: certViewMode === "list" ? COLORS.accent : "#fff", color: certViewMode === "list" ? "#fff" : COLORS.muted, display: "flex", borderLeft: `1px solid ${COLORS.border}` }}><List size={16} /></button>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 18 }}>
            <Search size={16} color={COLORS.muted} style={{ position: "absolute", left: 14, top: 13 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search address, postcode, landlord, company, cert no..." style={{ ...componentStyles.input, paddingLeft: 38, fontSize: 14, padding: "12px 14px 12px 38px" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: 12, background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={16} /></button>}
          </div>

          {certsLoading && (
            <div style={{ padding: 60, textAlign: "center", color: COLORS.muted, background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
              <Loader2 size={36} color={COLORS.accent} style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 16, fontSize: 14 }}>Loading certificates…</p>
            </div>
          )}

          {!certsLoading && filteredCerts.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: COLORS.muted, background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
              <FileText size={48} color={COLORS.border} />
              <p style={{ marginTop: 16, fontSize: 16 }}>{searchQuery ? "No matches." : "No certificates yet."}</p>
            </div>
          )}

          {/* LIST VIEW */}
          {!certsLoading && certViewMode === "list" && filteredCerts.length > 0 && (
            <div style={{ background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 0.8fr 60px 60px 100px", gap: 0, padding: "10px 16px", background: COLORS.primary, color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 700 }}>
                <span>Address</span><span>Landlord / Agent</span><span>Date</span><span>Cert #</span><span style={{ textAlign: "center" }}>Status</span><span style={{ textAlign: "center" }}>Safety</span><span>Actions</span>
              </div>
              {filteredCerts.map((item, idx) => {
                const isSafe = item.apps?.length > 0 && item.apps.every(a => a.appSafeToUse === "Yes");
                const isUnsafe = item.apps?.some(a => a.appSafeToUse === "No");
                return (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.9fr 0.8fr 60px 60px 100px", gap: 0, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, alignItems: "center", background: idx % 2 === 0 ? "#fff" : COLORS.inputBg, cursor: "pointer", minWidth: 700 }} onClick={() => openCert(item, false)}>
                  <span style={{ fontWeight: 500, color: COLORS.primary }}>{item.prop?.address || "—"} {item.prop?.postcode || ""}</span>
                  <span style={{ color: COLORS.muted }}>{item.ll?.company || item.ll?.name || "—"}</span>
                  <span style={{ color: COLORS.muted }}>{item.inspDate || "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{item.certNo || "—"}</span>
                  <span style={{ textAlign: "center" }}><span style={{ fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 12, background: item.status === "complete" ? COLORS.greenBg : COLORS.amberBg, color: item.status === "complete" ? COLORS.green : COLORS.amber }}>{item.status === "complete" ? "Done" : "Draft"}</span></span>
                  <span style={{ textAlign: "center" }}>{isSafe ? <CheckCircle2 size={18} color={COLORS.green} /> : isUnsafe ? <XCircle size={18} color={COLORS.red} /> : <span style={{ color: COLORS.muted, fontSize: 11 }}>—</span>}</span>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openCert(item, true)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 4, cursor: "pointer", color: COLORS.muted, display: "flex" }}><Edit3 size={13} /></button>
                    <button onClick={() => dlPDF(item)} style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#fff", display: "flex" }}><Download size={13} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 4, cursor: "pointer", color: COLORS.red, display: "flex" }}><Trash2 size={13} /></button>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* CARD VIEW */}
          {!certsLoading && certViewMode === "card" && filteredCerts.map(item => {
            const contactName = item.ll?.company || item.ll?.name || "—";
            const contactType = (item.ct || "landlord").charAt(0).toUpperCase() + (item.ct || "landlord").slice(1);
            return (
              <div key={item.id} className="cp12-cert-card" style={{ background: COLORS.card, borderRadius: 16, border: `1.5px solid ${COLORS.border}`, padding: 0, marginBottom: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: item.status === "complete" ? COLORS.greenBg : COLORS.amberBg, borderBottom: `1px solid ${item.status === "complete" ? "#c8e6c9" : "#ffe0b2"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.status === "complete" ? <CheckCircle2 size={16} color={COLORS.green} /> : <FileText size={16} color={COLORS.amber} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.status === "complete" ? COLORS.green : COLORS.amber }}>{item.status === "complete" ? "Completed" : "Draft"}</span>
                    {(() => { const safe = item.apps?.length > 0 && item.apps.every(a => a.appSafeToUse === "Yes"); const unsafe = item.apps?.some(a => a.appSafeToUse === "No"); return safe ? <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: "#fff", color: COLORS.green, marginLeft: 4 }}>SAFE</span> : unsafe ? <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: "#fff", color: COLORS.red, marginLeft: 4 }}>UNSAFE</span> : null; })()}
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>Cert #{item.certNo || "—"}</span>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <MapPin size={16} color={COLORS.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Inspection Address</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.primary, marginTop: 2 }}>{item.prop?.address || "No address"}{item.prop?.postcode ? ` · ${item.prop.postcode}` : ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <Building2 size={16} color={COLORS.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{contactType}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginTop: 2 }}>{contactName}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Calendar size={16} color={COLORS.accent} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: COLORS.text, marginTop: 1 }}>{item.inspDate || "—"}</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0 18px 16px", display: "flex", gap: 8 }}>
                  <button onClick={() => openCert(item, true)} style={{ ...appS.outBtn, flex: 1, justifyContent: "center", padding: 10, fontSize: 13 }}><Edit3 size={14} /> Edit</button>
                  <button onClick={() => openCert(item, false)} style={{ ...appS.outBtn, flex: 1, justifyContent: "center", padding: 10, fontSize: 13 }}><FileText size={14} /> View</button>
                  <button onClick={() => dlPDF(item)} className="cp12-download-btn" type="button">
                    <span className="cp12-dl-text"><Download size={14} /> PDF</span>
                    <span className="cp12-dl-icon"><Download size={18} strokeWidth={2.5} /></span>
                  </button>
                  <button onClick={() => setDeleteTarget(item.id)} className="cp12-delete-btn" type="button">
                    <span className="cp12-del-text">Delete</span>
                    <span className="cp12-del-icon"><X size={18} strokeWidth={3} /></span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <ConfirmDialog open={!!deleteTarget} title="Delete Certificate?" message="This will be permanently deleted." onConfirm={confirmDel} onCancel={() => setDeleteTarget(null)} />
      </div>
    );
  }

  /* ═════ FORM ═════ */
  const renderStep = () => {
    switch (currentStep) {
      case 1: return (<div>
        <StepTitle icon={User} title="Engineer & Company Details" description="Your Gas Safe registration and business information." />
        <ChooseExisting storageKey="cp12_existing_engineers" labelField="name" secondaryField="company" onSelect={(entry) => { setActiveCert(prev => ({ ...prev, eng: { ...entry } })); toast("Loaded", "success"); }} />
        <div style={appS.grid}>
          <FormField label="Engineer Full Name" required half><input style={componentStyles.input} value={cert.eng.name} onChange={e => updateField("eng.name", e.target.value)} placeholder="e.g. James Thompson" /></FormField>
          <FormField label="Company / Trading Name" half><input style={componentStyles.input} value={cert.eng.company} onChange={e => updateField("eng.company", e.target.value)} placeholder="e.g. SafeGas Solutions Ltd" /></FormField>
          <FormField label="Business Address"><input style={componentStyles.input} value={cert.eng.address} onChange={e => updateField("eng.address", e.target.value)} placeholder="Full business address" /></FormField>
          <FormField label="Telephone" half><input style={componentStyles.input} type="tel" value={cert.eng.tel} onChange={e => updateField("eng.tel", e.target.value)} placeholder="07700 900123" /></FormField>
          <FormField label="Email" half><input style={componentStyles.input} type="email" value={cert.eng.email} onChange={e => updateField("eng.email", e.target.value)} placeholder="email@example.com" /></FormField>
          <FormField label="Gas Safe Reg. No." required half><input style={componentStyles.input} value={cert.eng.gasSafe} onChange={e => updateField("eng.gasSafe", e.target.value)} placeholder="123456" /></FormField>
          <FormField label="ID Card No." half><input style={componentStyles.input} value={cert.eng.idCard} onChange={e => updateField("eng.idCard", e.target.value)} placeholder="0012345" /></FormField>
        </div>
      </div>);
      case 2: return (<div>
        <StepTitle icon={Home} title="Property Address" description="Property being inspected." />
        <ChooseExisting storageKey="cp12_existing_properties" labelField="address" secondaryField="postcode" onSelect={(entry) => { setActiveCert(prev => ({ ...prev, prop: { ...entry } })); toast("Loaded", "success"); }} />
        <div style={appS.grid}>
          <FormField label="CP12 No." half><input style={componentStyles.input} value={cert.certNo} onChange={e => updateField("certNo", e.target.value)} placeholder="0001" /></FormField>
          <FormField label="No. Appliances" half><input style={{ ...componentStyles.input, background: "#f1f3f5", color: COLORS.muted }} value={cert.apps.length} readOnly /></FormField>
          <FormField label="Name (Tenant / Occupier)"><input style={componentStyles.input} value={cert.prop.name} onChange={e => updateField("prop.name", e.target.value)} placeholder="Tenant name" /></FormField>
          <FormField label="Address" required><input style={componentStyles.input} value={cert.prop.address} onChange={e => updateField("prop.address", e.target.value)} placeholder="12 High Street" /></FormField>
          <FormField label="Town / City" required half><input style={componentStyles.input} value={cert.prop.city} onChange={e => updateField("prop.city", e.target.value)} placeholder="London" /></FormField>
          <FormField label="County" half><input style={componentStyles.input} value={cert.prop.county} onChange={e => updateField("prop.county", e.target.value)} placeholder="Greater London" /></FormField>
          <FormField label="Postcode" required half><input style={{ ...componentStyles.input, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }} value={cert.prop.postcode} onChange={e => updateField("prop.postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" /></FormField>
          <FormField label="Mobile" half><input style={componentStyles.input} type="tel" value={cert.prop.mobile} onChange={e => updateField("prop.mobile", e.target.value)} placeholder="Mobile" /></FormField>
          <FormField label="Landline" half><input style={componentStyles.input} type="tel" value={cert.prop.landline} onChange={e => updateField("prop.landline", e.target.value)} placeholder="Landline" /></FormField>
          <FormField label="Email"><input style={componentStyles.input} type="email" value={cert.prop.email} onChange={e => updateField("prop.email", e.target.value)} placeholder="tenant@email.com" /></FormField>
        </div>
        <div style={{ ...appS.grid, marginTop: 18 }}>
          <FormField label="Inspection Date" required half><input style={componentStyles.input} type="date" value={cert.inspDate} onChange={e => updateField("inspDate", e.target.value)} /></FormField>
          <FormField label="Next Inspection Due" half><input style={{ ...componentStyles.input, background: "#f1f3f5", color: COLORS.muted }} type="date" value={cert.nextDate} readOnly /><span style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Auto: 12 months</span></FormField>
        </div>
      </div>);
      case 3: return (<div>
        <StepTitle icon={Building2} title="Landlord / Agent / Customer" description="Person responsible for the property." />
        <ChooseExisting storageKey="cp12_existing_landlords" labelField="name" secondaryField="address" onSelect={(entry) => { setActiveCert(prev => ({ ...prev, ll: { ...entry } })); toast("Loaded", "success"); }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["landlord", "agent", "customer"].map(type => (
            <button key={type} type="button" onClick={() => updateField("ct", type)} style={{ padding: "8px 18px", borderRadius: 9, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: cert.ct === type ? COLORS.accent : "transparent", color: cert.ct === type ? "#fff" : COLORS.muted, borderColor: cert.ct === type ? COLORS.accent : COLORS.border }}>{type.charAt(0).toUpperCase() + type.slice(1)}</button>
          ))}
        </div>
        <div style={appS.grid}>
          <FormField label="Name" required half><input style={componentStyles.input} value={cert.ll.name} onChange={e => updateField("ll.name", e.target.value)} placeholder="Full name" /></FormField>
          <FormField label="Company Name" half><input style={componentStyles.input} value={cert.ll.company} onChange={e => updateField("ll.company", e.target.value)} placeholder="Company" /></FormField>
          <FormField label="Address" required><input style={componentStyles.input} value={cert.ll.address} onChange={e => updateField("ll.address", e.target.value)} placeholder="Full address" /></FormField>
          <FormField label="City" half><input style={componentStyles.input} value={cert.ll.city} onChange={e => updateField("ll.city", e.target.value)} placeholder="City" /></FormField>
          <FormField label="Postcode" half><input style={{ ...componentStyles.input, textTransform: "uppercase" }} value={cert.ll.postcode} onChange={e => updateField("ll.postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" /></FormField>
          <FormField label="Email" half><input style={componentStyles.input} type="email" value={cert.ll.email} onChange={e => updateField("ll.email", e.target.value)} placeholder="email@example.com" /></FormField>
          <FormField label="Phone" half><input style={componentStyles.input} type="tel" value={cert.ll.phone} onChange={e => updateField("ll.phone", e.target.value)} placeholder="Phone" /></FormField>
        </div>
      </div>);
      case 4: return (<div>
        <StepTitle icon={Flame} title="Appliance Details" description={`${cert.apps.length} appliance${cert.apps.length > 1 ? "s" : ""} added.`} />
        {cert.apps.map((app, idx) => <ApplianceCard key={app.id} appliance={app} index={idx} onUpdate={updateApp} onRemove={removeApp} canRemove={cert.apps.length > 1} />)}
        <button onClick={addApp} type="button" className="cp12-add-appliance-btn" style={appS.addBtn}><Plus size={20} /> Add Appliance</button>
      </div>);
      case 5: return (<div>
        <StepTitle icon={Wrench} title="Pipework & CO Alarms" description="Gas supply and alarm checks." />
        <SectionHeader title="Pipework Checks" icon={Wrench} />
        <div style={appS.checkGrid}>
          <FormField label="Satisfactory Visual Inspection"><TriStateButtons value={cert.pipe.visualInsp} onChange={v => updateField("pipe.visualInsp", v)} /></FormField>
          <FormField label="Emergency Control Accessible"><TriStateButtons value={cert.pipe.ecvAccessible} onChange={v => updateField("pipe.ecvAccessible", v)} /></FormField>
          <FormField label="Satisfactory Gas Tightness Test"><TriStateButtons value={cert.pipe.gasTightness} onChange={v => updateField("pipe.gasTightness", v)} /></FormField>
          <FormField label="Equipotential Bonding Satisfactory"><TriStateButtons value={cert.pipe.bonding} onChange={v => updateField("pipe.bonding", v)} /></FormField>
        </div>
        <SectionHeader title="Audible CO Alarms" icon={Shield} />
        <div style={appS.checkGrid}>
          <FormField label="Approved CO Alarms Fitted"><TriStateButtons value={cert.alarms.coFitted} onChange={v => updateField("alarms.coFitted", v)} /></FormField>
          <FormField label="Are CO Alarms in Date"><TriStateButtons value={cert.alarms.coInDate} onChange={v => updateField("alarms.coInDate", v)} /></FormField>
          <FormField label="Testing CO Alarms"><TriStateButtons value={cert.alarms.coTested} onChange={v => updateField("alarms.coTested", v)} /></FormField>
          <FormField label="Smoke Alarms Fitted"><TriStateButtons value={cert.alarms.smokeFitted} onChange={v => updateField("alarms.smokeFitted", v)} /></FormField>
        </div>
      </div>);
      case 6: return (<div>
        <StepTitle icon={AlertTriangle} title="Faults & Works" description="Defects and work carried out." />
        <FormField label="Give Details of Any Faults"><textarea style={{ ...componentStyles.input, minHeight: 110, resize: "vertical", lineHeight: 1.7 }} value={cert.faults} onChange={e => updateField("faults", e.target.value)} placeholder="Describe faults..." /></FormField>
        <div style={{ marginTop: 16 }}><FormField label="Rectification Work Carried Out"><textarea style={{ ...componentStyles.input, minHeight: 110, resize: "vertical", lineHeight: 1.7 }} value={cert.rect} onChange={e => updateField("rect", e.target.value)} placeholder="Remedial actions..." /></FormField></div>
        <div style={{ marginTop: 16 }}><FormField label="Details of Works"><textarea style={{ ...componentStyles.input, minHeight: 90, resize: "vertical", lineHeight: 1.7 }} value={cert.works} onChange={e => updateField("works", e.target.value)} placeholder="Additional works..." /></FormField></div>
        <div style={{ marginTop: 16 }}><FormField label="Has flue cap been put back?"><TriStateButtons value={cert.flueCap} onChange={v => updateField("flueCap", v)} /></FormField></div>
      </div>);
      case 7: return (<div>
        <StepTitle icon={PenTool} title="Declaration & Signatures" description="Confirm and sign off." />
        <div style={{ background: COLORS.accentBg, borderRadius: 14, padding: 20 }}><p style={{ fontSize: 14, lineHeight: 1.7, color: COLORS.text }}>I declare that the appliance(s) and flue(s) detailed in this report have been inspected in accordance with the Gas Industry Unsafe Situations Procedure and the Gas Safety (Installation and Use) Regulations 1998. All readings and results are accurate.</p></div>
        <div style={{ marginTop: 18 }}><label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}><input type="checkbox" checked={cert.decl.confirmed} onChange={e => updateField("decl.confirmed", e.target.checked)} style={{ width: 22, height: 22, accentColor: COLORS.accent }} /><span style={{ fontSize: 15, fontWeight: 600 }}>I confirm this is true and accurate</span></label></div>
        <div style={{ ...appS.grid, marginTop: 22 }}>
          <FormField label="Engineer Printed Name" required half><input style={componentStyles.input} value={cert.decl.engSig} onChange={e => updateField("decl.engSig", e.target.value)} placeholder="Full name" /></FormField>
          <FormField label="Received By" half><input style={componentStyles.input} value={cert.decl.receivedBy} onChange={e => updateField("decl.receivedBy", e.target.value)} placeholder="Tenant / landlord" /></FormField>
        </div>
        {cert.decl.engSig && <div style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, background: "#fafafa", border: `1.5px solid ${COLORS.border}`, textAlign: "center" }}><span style={{ fontSize: 11, color: COLORS.muted }}>Signature</span><div style={{ fontFamily: "cursive", fontSize: 28, color: COLORS.primary, marginTop: 6, fontStyle: "italic" }}>{cert.decl.engSig}</div></div>}
      </div>);
      case 8: return (<div>
        <StepTitle icon={Send} title="Review & Download" description="Review, save, download, or email." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {[{ t: "Engineer", i: User, r: [["Name", cert.eng.name], ["Gas Safe", cert.eng.gasSafe], ["Company", cert.eng.company]] },
            { t: "Property", i: Home, r: [["Address", [cert.prop.address, cert.prop.city, cert.prop.postcode].filter(Boolean).join(", ")], ["Inspected", cert.inspDate], ["Next Due", cert.nextDate]] },
            { t: (cert.ct || "landlord").charAt(0).toUpperCase() + (cert.ct || "landlord").slice(1), i: Building2, r: [["Name", cert.ll.name], ["Phone", cert.ll.phone], ["Email", cert.ll.email]] },
          ].map(card => (
            <div key={card.t} style={appS.sumCard}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><card.i size={14} color={COLORS.accent} /><span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 1 }}>{card.t}</span></div>
              {card.r.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${COLORS.border}22` }}><span style={{ fontSize: 12, color: COLORS.muted }}>{k}</span><span style={{ fontSize: 12, fontWeight: 500, textAlign: "right", maxWidth: "60%", wordBreak: "break-all", overflowWrap: "anywhere" }}>{v || "—"}</span></div>)}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}><SectionHeader title={`Appliances (${cert.apps.length})`} icon={Flame} />
          {cert.apps.map((app, i) => (
            <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, marginBottom: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.accentBg, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{app.type || "Appliance " + (i + 1)}</div><div style={{ fontSize: 12, color: COLORS.muted }}>{[app.location, app.make, app.model].filter(Boolean).join(" · ")}</div></div>
              <span style={{ fontWeight: 700, fontSize: 12, padding: "3px 12px", borderRadius: 20, background: app.appSafeToUse === "Yes" ? COLORS.greenBg : app.appSafeToUse === "No" ? COLORS.redBg : COLORS.accentBg, color: app.appSafeToUse === "Yes" ? COLORS.green : app.appSafeToUse === "No" ? COLORS.red : COLORS.muted }}>{app.appSafeToUse ? (app.appSafeToUse === "Yes" ? "SAFE" : "UNSAFE") : "—"}</span>
            </div>
          ))}
        </div>
        <div className={isOverallSafe ? "cp12-status-pulse" : ""} style={{ marginTop: 16, padding: "16px 18px", borderRadius: 12, border: "2px solid", textAlign: "center", fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: isOverallSafe ? COLORS.greenBg : COLORS.redBg, borderColor: isOverallSafe ? "#66bb6a" : "#ef5350", color: isOverallSafe ? COLORS.green : COLORS.red }}>
          {isOverallSafe ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />} Overall: {isOverallSafe ? "SATISFACTORY" : cert.apps.some(a => a.appSafeToUse === "No") ? "UNSATISFACTORY" : "INCOMPLETE"}
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => saveCert("complete")} className="cp12-save-btn" style={{ ...appS.accentBtn, flex: 1, justifyContent: "center", padding: 14 }}><CheckCircle2 size={17} /> Save Certificate</button>
          <button onClick={() => saveCert("draft")} style={{ ...appS.outBtn, flex: 1, justifyContent: "center", padding: 14 }}><FileText size={17} /> Save Draft</button>
        </div>
        <button onClick={() => dlPDF(cert)} className="cp12-download-btn-full" type="button">
          <span className="cp12-dlf-text"><Download size={18} /> Download PDF</span>
          <span className="cp12-dlf-icon"><Download size={22} strokeWidth={2.5} /></span>
        </button>

        {/* ─── EMAIL PDF BUTTON (NEW) ─── */}
        {(() => {
          const emails = [cert.ll?.email, cert.eng?.email].filter(Boolean);
          const hasEmails = emails.length > 0;
          return (
            <button onClick={() => sendCertEmail(cert)} disabled={emailSending || !hasEmails} style={{
              ...appS.darkBtn, width: "100%", marginTop: 10, opacity: (!hasEmails || emailSending) ? 0.5 : 1,
              background: COLORS.green,
            }}>
              {emailSending ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={18} />}
              {emailSending ? "Sending…" : hasEmails ? `Email PDF to ${emails.join(" & ")}` : "No email addresses on certificate"}
            </button>
          );
        })()}

        <button onClick={() => { saveCert(cert.status === "complete" ? "complete" : "draft"); setCurrentView("dashboard"); }} style={{ ...appS.outBtn, width: "100%", marginTop: 10, justifyContent: "center", padding: 14 }}><ChevronLeft size={17} /> Back to Dashboard</button>
      </div>);
      default: return null;
    }
  };

  return (
    <div style={appS.root}><GlobalStyles /><div style={appS.bgDots} />
      <div style={appS.container}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => { saveCert(activeCert?.status || "draft"); setCurrentView("dashboard"); }}>
            <AppLogo size={44} /><div><h1 style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary, margin: 0, letterSpacing: -0.5 }}>Gas Safety Certificates</h1><p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>CP12 Certificate</p></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SyncBadge status={syncStatus} />
            <button onClick={() => { saveCert(activeCert?.status || "draft"); setCurrentView("dashboard"); }} style={{ ...appS.outBtn, padding: "7px 14px", fontSize: 12 }}><FolderOpen size={14} /> Dashboard</button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 22, padding: "6px 2px 0", overflow: "visible" }}>
          {FORM_STEPS.map((step, i) => {
            const SI = STEP_ICONS[step.id]; const done = currentStep > step.id; const act = currentStep === step.id;
            return (
              <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1, minWidth: 44, overflow: "visible", cursor: "pointer" }} onClick={() => { setSlideDirection(step.id > currentStep ? 1 : -1); setSlideKey(k => k + 1); setCurrentStep(step.id); }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${done ? COLORS.green : act ? COLORS.accent : COLORS.border}`, background: done ? COLORS.green : act ? COLORS.accent : "#fff", color: done || act ? "#fff" : COLORS.muted, transition: "all 0.3s", boxShadow: act ? `0 0 0 5px ${COLORS.accent}20` : "none" }}>
                  {done ? <Check size={14} strokeWidth={3} /> : <SI size={13} />}
                </div>
                <span style={{ fontSize: 9, marginTop: 4, color: done || act ? COLORS.text : COLORS.muted, fontWeight: act ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>{step.label}</span>
                {i < FORM_STEPS.length - 1 && <div style={{ position: "absolute", top: 15, left: "calc(50% + 18px)", right: "calc(-50% + 18px)", height: 2.5, background: done ? COLORS.green : COLORS.border, transition: "background 0.3s", borderRadius: 1 }} />}
              </div>
            );
          })}
        </div>
        <div key={slideKey} style={{ background: COLORS.card, borderRadius: 18, padding: "26px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 8px 28px rgba(0,0,0,.04)", border: `1px solid ${COLORS.border}`, animation: slideDirection > 0 ? "slideInRight 0.3s ease" : slideDirection < 0 ? "slideInLeft 0.3s ease" : "fadeIn 0.3s ease" }}>
          {renderStep()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          {currentStep > 1 && <button onClick={() => navStep(-1)} style={appS.outBtn} type="button"><ChevronLeft size={17} /> Back</button>}
          <div style={{ flex: 1 }} /><span style={{ fontSize: 12, color: COLORS.muted, display: "flex", alignItems: "center", gap: 5 }}><FileText size={13} /> {currentStep}/8</span><div style={{ flex: 1 }} />
          {currentStep < 8 && <button onClick={() => navStep(1)} style={appS.accentBtn} type="button">Continue <ChevronRight size={17} /></button>}
        </div>
      </div>
      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} userName={userName} setUserName={setUserName} />}
    </div>
  );
}

/* ═════ ERROR BOUNDARY ═════ */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit',sans-serif", background: COLORS.bg, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
            <AlertTriangle size={40} color={COLORS.amber} style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.primary, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: COLORS.muted, marginBottom: 20, lineHeight: 1.6 }}>Old data may be conflicting.</p>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: "12px 24px", borderRadius: 10, background: COLORS.accent, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", width: "100%", marginBottom: 10 }}>Clear Data & Reload</button>
            <button onClick={() => window.location.reload()} style={{ padding: "12px 24px", borderRadius: 10, background: "transparent", color: COLORS.muted, border: `1.5px solid ${COLORS.border}`, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>Try Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return <ErrorBoundary><ToastProvider><AppContent /></ToastProvider></ErrorBoundary>;
}

const appS = {
  root: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Outfit',sans-serif", color: COLORS.text, position: "relative", overflow: "hidden" },
  bgDots: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(${COLORS.border}80 1px,transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.5, pointerEvents: "none" },
  container: { position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "20px 16px 50px" },
  grid: { display: "flex", flexWrap: "wrap", gap: 14 },
  checkGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12, marginTop: 10 },
  sumCard: { background: COLORS.inputBg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` },
  addBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 16, borderRadius: 12, border: `2px dashed ${COLORS.accent}50`, background: `${COLORS.accentBg}50`, color: COLORS.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  accentBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: COLORS.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 2px 10px ${COLORS.accent}30` },
  outBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, background: "transparent", border: `1.5px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  darkBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: 10, background: COLORS.primary, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  iconBtn: { background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8, cursor: "pointer", color: COLORS.muted, display: "flex", alignItems: "center" },
};
