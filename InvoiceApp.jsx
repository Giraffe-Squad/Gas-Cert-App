/* ═══════════════════════════════════════════════════════════════
   INVOICE APP — Full invoice management system
   Matches the CP12 certificate app design language
   ═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  User, Building2, ChevronDown, ChevronLeft, ChevronRight, Plus, Check,
  Trash2, FileText, Download, FolderOpen, FilePlus, Calendar, Search, X,
  Edit3, MapPin, LayoutGrid, List, Loader2, RefreshCw, CloudOff, Cloud,
  Send, PenTool, Receipt, DollarSign, Hash, Mail,
} from "lucide-react";

import {
  COLORS, INVOICE_STEPS, createEmptyLineItem, createEmptyInvoice,
  calcInvoiceTotals, loadFromStorage, saveToStorage,
} from "./data";

import {
  fetchInvoices, upsertInvoice, deleteInvoice, migrateLocalInvoices,
} from "./invoiceService";

import { generateInvoicePDF } from "./generateInvoicePDF";
import { emailInvoice } from "./emailService";

import {
  useToast, ConfirmDialog, FormField, SectionHeader, StepTitle,
  ChooseExisting, saveExistingEntry, componentStyles,
} from "./components";

const STEP_ICONS = { 1: User, 2: Building2, 3: Receipt, 4: Send };

/* ═══════════════════════════════════════════════════════════════
   SYNC BADGE (reused pattern)
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
    <span title="Sync error" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.red, fontWeight: 600 }}>
      <CloudOff size={13} /> Offline
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LINE ITEM ROW
   ═══════════════════════════════════════════════════════════════ */
function LineItemRow({ item, index, onUpdate, onRemove, canRemove }) {
  const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-end", padding: "12px 14px",
      borderRadius: 12, background: index % 2 === 0 ? "#fff" : COLORS.inputBg,
      border: `1px solid ${COLORS.border}`, marginBottom: 8,
    }}>
      <div style={{ flex: 3, minWidth: 140 }}>
        <label style={{ ...componentStyles.label, fontSize: 10, marginBottom: 3, display: "block" }}>Description</label>
        <input style={componentStyles.input} value={item.description} onChange={e => onUpdate(item.id, "description", e.target.value)} placeholder="e.g. Boiler service" />
      </div>
      <div style={{ flex: 0.7, minWidth: 60 }}>
        <label style={{ ...componentStyles.label, fontSize: 10, marginBottom: 3, display: "block" }}>Qty</label>
        <input style={{ ...componentStyles.input, textAlign: "center" }} type="number" min="0" step="1" value={item.quantity} onChange={e => onUpdate(item.id, "quantity", e.target.value)} />
      </div>
      <div style={{ flex: 1, minWidth: 80 }}>
        <label style={{ ...componentStyles.label, fontSize: 10, marginBottom: 3, display: "block" }}>Rate (£)</label>
        <input style={componentStyles.input} type="number" min="0" step="0.01" value={item.rate} onChange={e => onUpdate(item.id, "rate", e.target.value)} placeholder="0.00" />
      </div>
      <div style={{ flex: 0.8, minWidth: 70, textAlign: "right" }}>
        <label style={{ ...componentStyles.label, fontSize: 10, marginBottom: 3, display: "block" }}>Amount</label>
        <div style={{ padding: "10px 8px", fontSize: 14, fontWeight: 700, color: COLORS.primary }}>
          £{lineTotal.toFixed(2)}
        </div>
      </div>
      {canRemove && (
        <button onClick={() => onRemove(item.id)} style={{ background: "transparent", border: "none", color: COLORS.red, cursor: "pointer", padding: 6, opacity: 0.5, marginBottom: 4 }} type="button">
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN INVOICE APP COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function InvoiceApp({ onBack, session }) {
  const toast = useToast();

  const [currentView, setCurrentView] = useState("list");
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [syncStatus, setSyncStatus] = useState("synced");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // ─── Load invoices ───
  useEffect(() => {
    if (!session) { setInvoices([]); setInvoicesLoading(false); return; }
    let cancelled = false;

    async function loadInvoices() {
      setInvoicesLoading(true);
      const localInvs = loadFromStorage("cp12_invoices", []);
      if (localInvs.length > 0 && !cancelled) setInvoices(localInvs);

      try {
        const migrated = await migrateLocalInvoices();
        if (migrated > 0 && !cancelled) toast(`Migrated ${migrated} invoice${migrated > 1 ? "s" : ""} to cloud`, "success");

        const cloudInvs = await fetchInvoices();
        if (!cancelled) {
          if (cloudInvs.length > 0) {
            setInvoices(cloudInvs);
            setSyncStatus("synced");
          } else if (localInvs.length > 0) {
            setSyncStatus("syncing");
            let pushed = 0;
            for (const inv of localInvs) {
              try { await upsertInvoice(inv); pushed++; } catch (e) { console.error("Push failed:", inv.id, e); }
            }
            setInvoices(localInvs);
            setSyncStatus(pushed > 0 ? "synced" : "error");
          } else {
            setInvoices([]);
            setSyncStatus("synced");
          }
        }
      } catch (err) {
        console.error("Failed to load invoices:", err);
        if (!cancelled) { setSyncStatus("error"); toast("Using local data — cloud sync failed", "error"); }
      } finally {
        if (!cancelled) { setInvoicesLoading(false); setInitialLoadDone(true); }
      }
    }

    loadInvoices();
    return () => { cancelled = true; };
  }, [session]);

  // Local backup
  useEffect(() => { if (initialLoadDone) saveToStorage("cp12_invoices", invoices); }, [invoices, initialLoadDone]);

  const filteredInvoices = useMemo(() => {
    const rev = [...invoices].reverse();
    if (!searchQuery.trim()) return rev;
    const q = searchQuery.toLowerCase();
    return rev.filter(inv =>
      (inv.customer?.name || "").toLowerCase().includes(q) ||
      (inv.customer?.company || "").toLowerCase().includes(q) ||
      (inv.customer?.address || "").toLowerCase().includes(q) ||
      (inv.invoiceNo || "").toLowerCase().includes(q) ||
      (inv.business?.name || "").toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  const refreshInvoices = useCallback(async () => {
    if (!session) return;
    try {
      setSyncStatus("syncing");
      const cloudInvs = await fetchInvoices();
      if (cloudInvs.length > 0) {
        setInvoices(cloudInvs);
        setSyncStatus("synced");
        toast("Synced from cloud", "success");
      } else if (invoices.length > 0) {
        let pushed = 0;
        for (const inv of invoices) {
          try { await upsertInvoice(inv); pushed++; } catch (e) { console.error(e); }
        }
        setSyncStatus(pushed > 0 ? "synced" : "error");
      } else {
        setSyncStatus("synced");
      }
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
      toast("Sync failed — data safe locally", "error");
    }
  }, [session, invoices]);

  // ─── Actions ───
  const startNew = () => {
    const newInv = createEmptyInvoice();
    const existingNums = invoices.map(inv => {
      const match = (inv.invoiceNo || "").match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 0) + 1;
    newInv.invoiceNo = "INV-" + String(nextNum).padStart(4, "0");

    // Auto-populate business details from last invoice
    const lastInv = invoices[invoices.length - 1];
    if (lastInv?.business?.name) newInv.business = { ...lastInv.business };

    setActiveInvoice(newInv);
    setCurrentStep(1);
    setSlideDirection(0);
    setSlideKey(0);
    setCurrentView("form");
  };

  const openInvoice = (inv, editMode = false) => {
    setActiveInvoice({ ...inv });
    setCurrentStep(editMode ? 1 : 4);
    setCurrentView("form");
  };

  const saveInvoice = async (status = "draft") => {
    if (!activeInvoice) return;
    const updated = { ...activeInvoice, status, updatedAt: new Date().toISOString() };

    setInvoices(prev => {
      const idx = prev.findIndex(i => i.id === updated.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = updated; return n; }
      return [...prev, updated];
    });
    setActiveInvoice(updated);

    if (updated.business.name) saveExistingEntry("cp12_existing_businesses", updated.business, "name");
    if (updated.customer.name) saveExistingEntry("cp12_existing_inv_customers", updated.customer, "name");

    setSyncStatus("syncing");
    try {
      await upsertInvoice(updated);
      setSyncStatus("synced");
      toast(status === "complete" ? "Invoice saved!" : "Draft saved", "success");
    } catch (err) {
      console.error(err);
      setSyncStatus("error");
      toast("Saved locally", "info");
    }
  };

  const confirmDel = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget;
    setDeleteTarget(null);
    const remaining = invoices.filter(i => i.id !== targetId);
    setInvoices(remaining);
    saveToStorage("cp12_invoices", remaining);
    // NOTE: Deleting invoices does NOT delete saved business/customer entries
    // Those are stored separately and persist for future use
    setSyncStatus("syncing");
    try { await deleteInvoice(targetId); setSyncStatus("synced"); toast("Deleted", "info"); } catch { setSyncStatus("error"); toast("Deleted locally", "info"); }
  };

  const dlPDF = (inv) => { try { generateInvoicePDF(inv); } catch (err) { console.error(err); toast("PDF failed", "error"); } };

  const sendEmail = async (inv) => {
    if (!inv.customer?.email) { toast("No customer email found", "error"); return; }
    setEmailSending(true);
    try {
      const pdfDoc = generateInvoicePDF(inv, false);
      const result = await emailInvoice(inv, pdfDoc);
      if (result.success) toast(result.message, "success");
      else toast(result.message, "error");
    } catch (err) {
      console.error(err);
      toast("Email failed", "error");
    } finally {
      setEmailSending(false);
    }
  };

  // Form helpers
  const updateField = (path, val) => {
    if (!activeInvoice) return;
    setActiveInvoice(prev => {
      const n = { ...prev };
      const p = path.split(".");
      if (p.length === 2) n[p[0]] = { ...n[p[0]], [p[1]]: val };
      else n[p[0]] = val;
      return n;
    });
  };
  const updateItem = (id, f, v) => setActiveInvoice(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, [f]: v } : i) }));
  const removeItem = (id) => { setActiveInvoice(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) })); toast("Removed", "info"); };
  const addItem = () => { setActiveInvoice(prev => ({ ...prev, items: [...prev.items, createEmptyLineItem()] })); toast("Added", "success"); };
  const navStep = (d) => { setSlideDirection(d); setSlideKey(k => k + 1); setCurrentStep(s => Math.max(1, Math.min(4, s + d))); };

  const inv = activeInvoice || createEmptyInvoice();
  const { subtotal, vatAmount, total } = calcInvoiceTotals(inv);

  /* ═════ INVOICE LIST VIEW ═════ */
  if (currentView === "list") {
    return (
      <div style={s.root}>
        <div style={s.bgDots} />
        <div style={s.container}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <button onClick={onBack} style={{ ...s.iconBtn, padding: 8 }}><ChevronLeft size={20} /></button>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary, margin: 0 }}>Invoices</h1>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>
                {invoicesLoading ? "Loading…" : `${invoices.length} total`}
              </p>
            </div>
            <SyncBadge status={syncStatus} />
            <button onClick={refreshInvoices} title="Refresh" style={{ ...s.iconBtn, padding: 6 }}>
              <RefreshCw size={15} style={syncStatus === "syncing" ? { animation: "spin 1s linear infinite" } : {}} />
            </button>
            <div style={{ display: "flex", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, overflow: "hidden" }}>
              <button onClick={() => setViewMode("card")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "card" ? COLORS.accent : "#fff", color: viewMode === "card" ? "#fff" : COLORS.muted, display: "flex" }}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode("list")} style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "list" ? COLORS.accent : "#fff", color: viewMode === "list" ? "#fff" : COLORS.muted, display: "flex", borderLeft: `1px solid ${COLORS.border}` }}><List size={16} /></button>
            </div>
          </div>

          {/* Create New */}
          <button onClick={startNew} className="cp12-primary-btn" type="button" style={{ marginBottom: 18 }}>
            <span className="cp12-btn-circle" aria-hidden="true"></span>
            <span className="cp12-btn-content"><FilePlus size={22} strokeWidth={2.5} /><span>Create New Invoice</span></span>
            <ChevronRight size={22} strokeWidth={3} className="cp12-btn-arrow" aria-hidden="true" />
          </button>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 18 }}>
            <Search size={16} color={COLORS.muted} style={{ position: "absolute", left: 14, top: 13 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search customer, company, invoice no..." style={{ ...componentStyles.input, paddingLeft: 38, fontSize: 14, padding: "12px 14px 12px 38px" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: 12, background: "transparent", border: "none", cursor: "pointer", color: COLORS.muted }}><X size={16} /></button>}
          </div>

          {invoicesLoading && (
            <div style={{ padding: 60, textAlign: "center", color: COLORS.muted, background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
              <Loader2 size={36} color={COLORS.accent} style={{ animation: "spin 1s linear infinite" }} />
              <p style={{ marginTop: 16, fontSize: 14 }}>Loading invoices…</p>
            </div>
          )}

          {!invoicesLoading && filteredInvoices.length === 0 && (
            <div style={{ padding: 60, textAlign: "center", color: COLORS.muted, background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
              <Receipt size={48} color={COLORS.border} />
              <p style={{ marginTop: 16, fontSize: 16 }}>{searchQuery ? "No matches." : "No invoices yet."}</p>
            </div>
          )}

          {/* LIST VIEW */}
          {!invoicesLoading && viewMode === "list" && filteredInvoices.length > 0 && (
            <div style={{ background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`, overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 0.8fr 0.7fr 60px 100px", gap: 0, padding: "10px 16px", background: COLORS.primary, color: "#fff", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, minWidth: 600 }}>
                <span>Customer</span><span>Date</span><span>Invoice #</span><span>Total</span><span style={{ textAlign: "center" }}>Status</span><span>Actions</span>
              </div>
              {filteredInvoices.map((item, idx) => (
                <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 0.8fr 0.7fr 60px 100px", gap: 0, padding: "12px 16px", borderBottom: `1px solid ${COLORS.border}`, fontSize: 13, alignItems: "center", background: idx % 2 === 0 ? "#fff" : COLORS.inputBg, cursor: "pointer", minWidth: 600 }} onClick={() => openInvoice(item, false)}>
                  <span style={{ fontWeight: 500, color: COLORS.primary }}>{item.customer?.name || "—"}{item.customer?.company ? ` (${item.customer.company})` : ""}</span>
                  <span style={{ color: COLORS.muted }}>{item.invoiceDate || "—"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary }}>{item.invoiceNo || "—"}</span>
                  <span style={{ fontWeight: 700, color: COLORS.primary }}>£{calcInvoiceTotals(item).total.toFixed(2)}</span>
                  <span style={{ textAlign: "center" }}><span style={{ fontWeight: 700, fontSize: 10, padding: "2px 8px", borderRadius: 12, background: item.status === "complete" ? COLORS.greenBg : COLORS.amberBg, color: item.status === "complete" ? COLORS.green : COLORS.amber }}>{item.status === "complete" ? "Sent" : "Draft"}</span></span>
                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => openInvoice(item, true)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 4, cursor: "pointer", color: COLORS.muted, display: "flex" }}><Edit3 size={13} /></button>
                    <button onClick={() => dlPDF(item)} style={{ background: COLORS.accent, border: "none", borderRadius: 6, padding: 4, cursor: "pointer", color: "#fff", display: "flex" }}><Download size={13} /></button>
                    <button onClick={() => setDeleteTarget(item.id)} style={{ background: "transparent", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 4, cursor: "pointer", color: COLORS.red, display: "flex" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CARD VIEW */}
          {!invoicesLoading && viewMode === "card" && filteredInvoices.map(item => {
            const { total: itemTotal } = calcInvoiceTotals(item);
            return (
              <div key={item.id} className="cp12-cert-card" style={{ background: COLORS.card, borderRadius: 16, border: `1.5px solid ${COLORS.border}`, padding: 0, marginBottom: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>
                <div style={{ padding: "8px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: item.status === "complete" ? COLORS.greenBg : COLORS.amberBg, borderBottom: `1px solid ${item.status === "complete" ? "#c8e6c9" : "#ffe0b2"}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Receipt size={16} color={item.status === "complete" ? COLORS.green : COLORS.amber} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.status === "complete" ? COLORS.green : COLORS.amber }}>{item.status === "complete" ? "Completed" : "Draft"}</span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>#{item.invoiceNo || "—"}</span>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <User size={16} color={COLORS.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Customer</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.primary, marginTop: 2 }}>{item.customer?.name || "No name"}</div>
                      {item.customer?.company && <div style={{ fontSize: 12, color: COLORS.muted }}>{item.customer.company}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={14} color={COLORS.accent} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Date</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.text }}>{item.invoiceDate || "—"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <DollarSign size={14} color={COLORS.accent} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.primary }}>£{itemTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0 18px 16px", display: "flex", gap: 8 }}>
                  <button onClick={() => openInvoice(item, true)} style={{ ...s.outBtn, flex: 1, justifyContent: "center", padding: 10, fontSize: 13 }}><Edit3 size={14} /> Edit</button>
                  <button onClick={() => openInvoice(item, false)} style={{ ...s.outBtn, flex: 1, justifyContent: "center", padding: 10, fontSize: 13 }}><FileText size={14} /> View</button>
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
        <ConfirmDialog open={!!deleteTarget} title="Delete Invoice?" message="This will be permanently deleted." onConfirm={confirmDel} onCancel={() => setDeleteTarget(null)} />
      </div>
    );
  }

  /* ═════ INVOICE FORM ═════ */
  const renderStep = () => {
    switch (currentStep) {
      case 1: return (<div>
        <StepTitle icon={User} title="Your Business Details" description="Your company information for the invoice header." />
        <ChooseExisting storageKey="cp12_existing_businesses" labelField="name" secondaryField="phone" onSelect={(entry) => { setActiveInvoice(prev => ({ ...prev, business: { ...entry } })); toast("Loaded", "success"); }} />
        <div style={s.grid}>
          <FormField label="Business Name" required half><input style={componentStyles.input} value={inv.business.name} onChange={e => updateField("business.name", e.target.value)} placeholder="e.g. Mediumlink UK Ltd" /></FormField>
          <FormField label="Phone" half><input style={componentStyles.input} type="tel" value={inv.business.phone} onChange={e => updateField("business.phone", e.target.value)} placeholder="07700 900123" /></FormField>
          <FormField label="Address"><input style={componentStyles.input} value={inv.business.address} onChange={e => updateField("business.address", e.target.value)} placeholder="Full business address" /></FormField>
          <FormField label="City" half><input style={componentStyles.input} value={inv.business.city} onChange={e => updateField("business.city", e.target.value)} placeholder="London" /></FormField>
          <FormField label="Postcode" half><input style={{ ...componentStyles.input, textTransform: "uppercase" }} value={inv.business.postcode} onChange={e => updateField("business.postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" /></FormField>
          <FormField label="Email"><input style={componentStyles.input} type="email" value={inv.business.email} onChange={e => updateField("business.email", e.target.value)} placeholder="email@example.com" /></FormField>
        </div>
      </div>);

      case 2: return (<div>
        <StepTitle icon={Building2} title="Customer Details" description="Who is this invoice for?" />
        <ChooseExisting storageKey="cp12_existing_inv_customers" labelField="name" secondaryField="company" onSelect={(entry) => { setActiveInvoice(prev => ({ ...prev, customer: { ...entry } })); toast("Loaded", "success"); }} />
        <div style={s.grid}>
          <FormField label="Invoice No." half><input style={componentStyles.input} value={inv.invoiceNo} onChange={e => updateField("invoiceNo", e.target.value)} placeholder="INV-0001" /></FormField>
          <FormField label="Invoice Date" required half><input style={componentStyles.input} type="date" value={inv.invoiceDate} onChange={e => updateField("invoiceDate", e.target.value)} /></FormField>
          <FormField label="Due Date" half><input style={componentStyles.input} type="date" value={inv.dueDate} onChange={e => updateField("dueDate", e.target.value)} /></FormField>
          <div style={{ flex: "1 1 47%", minWidth: 180 }} />
          <FormField label="Customer Name" required half><input style={componentStyles.input} value={inv.customer.name} onChange={e => updateField("customer.name", e.target.value)} placeholder="Full name" /></FormField>
          <FormField label="Company" half><input style={componentStyles.input} value={inv.customer.company} onChange={e => updateField("customer.company", e.target.value)} placeholder="Company name" /></FormField>
          <FormField label="Address" required><input style={componentStyles.input} value={inv.customer.address} onChange={e => updateField("customer.address", e.target.value)} placeholder="Full address" /></FormField>
          <FormField label="City" half><input style={componentStyles.input} value={inv.customer.city} onChange={e => updateField("customer.city", e.target.value)} placeholder="City" /></FormField>
          <FormField label="Postcode" half><input style={{ ...componentStyles.input, textTransform: "uppercase" }} value={inv.customer.postcode} onChange={e => updateField("customer.postcode", e.target.value.toUpperCase())} placeholder="SW1A 1AA" /></FormField>
          <FormField label="Email" half><input style={componentStyles.input} type="email" value={inv.customer.email} onChange={e => updateField("customer.email", e.target.value)} placeholder="customer@email.com" /></FormField>
          <FormField label="Phone" half><input style={componentStyles.input} type="tel" value={inv.customer.phone} onChange={e => updateField("customer.phone", e.target.value)} placeholder="Phone" /></FormField>
        </div>
      </div>);

      case 3: return (<div>
        <StepTitle icon={Receipt} title="Line Items" description={`${inv.items.length} item${inv.items.length > 1 ? "s" : ""} — add your services and materials.`} />
        {inv.items.map((item, idx) => (
          <LineItemRow key={item.id} item={item} index={idx} onUpdate={updateItem} onRemove={removeItem} canRemove={inv.items.length > 1} />
        ))}
        <button onClick={addItem} type="button" className="cp12-add-appliance-btn" style={s.addBtn}><Plus size={20} /> Add Line Item</button>

        {/* Totals */}
        <div style={{ marginTop: 20, padding: "18px 20px", borderRadius: 14, background: COLORS.inputBg, border: `1.5px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: COLORS.muted }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>£{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: COLORS.muted, flex: 1 }}>VAT Rate (%)</span>
            <input style={{ ...componentStyles.input, width: 80, textAlign: "center" }} type="number" min="0" step="0.5" value={inv.vatRate} onChange={e => updateField("vatRate", e.target.value)} placeholder="0" />
            <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, minWidth: 80, textAlign: "right" }}>£{vatAmount.toFixed(2)}</span>
          </div>
          <div style={{ borderTop: `2px solid ${COLORS.primary}`, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary }}>£{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes & Payment */}
        <div style={{ ...s.grid, marginTop: 18 }}>
          <FormField label="Payment Details"><textarea style={{ ...componentStyles.input, minHeight: 70, resize: "vertical", lineHeight: 1.7 }} value={inv.paymentDetails} onChange={e => updateField("paymentDetails", e.target.value)} placeholder="Bank details, payment terms..." /></FormField>
          <FormField label="Notes"><textarea style={{ ...componentStyles.input, minHeight: 60, resize: "vertical", lineHeight: 1.7 }} value={inv.notes} onChange={e => updateField("notes", e.target.value)} placeholder="Additional notes..." /></FormField>
        </div>
      </div>);

      case 4: return (<div>
        <StepTitle icon={Send} title="Review & Send" description="Review your invoice, save, and download or email." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
          {[
            { t: "Business", i: User, r: [["Name", inv.business.name], ["Phone", inv.business.phone], ["Email", inv.business.email]] },
            { t: "Customer", i: Building2, r: [["Name", inv.customer.name], ["Company", inv.customer.company], ["Email", inv.customer.email]] },
            { t: "Invoice", i: Receipt, r: [["Invoice #", inv.invoiceNo], ["Date", inv.invoiceDate], ["Due", inv.dueDate || "—"]] },
          ].map(card => (
            <div key={card.t} style={s.sumCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <card.i size={14} color={COLORS.accent} />
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 1 }}>{card.t}</span>
              </div>
              {card.r.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${COLORS.border}22` }}>
                  <span style={{ fontSize: 12, color: COLORS.muted }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{v || "—"}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Items Summary */}
        <div style={{ marginTop: 16 }}>
          <SectionHeader title={`Line Items (${inv.items.length})`} icon={Receipt} />
          {inv.items.map((item, i) => {
            const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: COLORS.accentBg, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.description || "Item " + (i + 1)}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted }}>{item.quantity} × £{parseFloat(item.rate || 0).toFixed(2)}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.primary }}>£{lineTotal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        {/* Total Badge */}
        <div style={{ marginTop: 16, padding: "16px 20px", borderRadius: 12, background: COLORS.accentBg, border: `2px solid ${COLORS.accent}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>Invoice Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.accent }}>£{total.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => saveInvoice("complete")} className="cp12-save-btn" style={{ ...s.accentBtn, flex: 1, justifyContent: "center", padding: 14 }}>
            <Check size={17} /> Save Invoice
          </button>
          <button onClick={() => saveInvoice("draft")} style={{ ...s.outBtn, flex: 1, justifyContent: "center", padding: 14 }}>
            <FileText size={17} /> Save Draft
          </button>
        </div>
        <button onClick={() => dlPDF(inv)} className="cp12-download-btn-full" type="button">
          <span className="cp12-dlf-text"><Download size={18} /> Download PDF</span>
          <span className="cp12-dlf-icon"><Download size={22} strokeWidth={2.5} /></span>
        </button>

        {/* Email Button */}
        <button onClick={() => sendEmail(inv)} disabled={emailSending || !inv.customer?.email} style={{
          ...s.darkBtn, width: "100%", marginTop: 10, opacity: (!inv.customer?.email || emailSending) ? 0.5 : 1,
          background: COLORS.green,
        }}>
          {emailSending ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={18} />}
          {emailSending ? "Sending…" : inv.customer?.email ? `Email to ${inv.customer.email}` : "No customer email"}
        </button>

        <button onClick={() => { saveInvoice(inv.status === "complete" ? "complete" : "draft"); setCurrentView("list"); }} style={{ ...s.outBtn, width: "100%", marginTop: 10, justifyContent: "center", padding: 14 }}>
          <ChevronLeft size={17} /> Back to Invoices
        </button>
      </div>);

      default: return null;
    }
  };

  return (
    <div style={s.root}>
      <div style={s.bgDots} />
      <div style={s.container}>
        {/* Header — Mediumlink UK LTD branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => { saveInvoice(activeInvoice?.status || "draft"); setCurrentView("list"); }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: COLORS.accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Receipt size={24} color={COLORS.accent} /></div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: COLORS.accent, margin: 0, letterSpacing: -0.5 }}>Mediumlink UK Ltd</h1>
              <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Invoice · {inv.invoiceNo || "New"}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SyncBadge status={syncStatus} />
            <button onClick={() => { saveInvoice(activeInvoice?.status || "draft"); setCurrentView("list"); }} style={{ ...s.outBtn, padding: "7px 14px", fontSize: 12 }}><FolderOpen size={14} /> Invoices</button>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 22, padding: "6px 2px 0", overflow: "visible" }}>
          {INVOICE_STEPS.map((step, i) => {
            const SI = STEP_ICONS[step.id]; const done = currentStep > step.id; const act = currentStep === step.id;
            return (
              <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1, minWidth: 44, overflow: "visible", cursor: "pointer" }} onClick={() => { setSlideDirection(step.id > currentStep ? 1 : -1); setSlideKey(k => k + 1); setCurrentStep(step.id); }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${done ? COLORS.green : act ? COLORS.accent : COLORS.border}`, background: done ? COLORS.green : act ? COLORS.accent : "#fff", color: done || act ? "#fff" : COLORS.muted, transition: "all 0.3s", boxShadow: act ? `0 0 0 5px ${COLORS.accent}20` : "none" }}>
                  {done ? <Check size={14} strokeWidth={3} /> : <SI size={13} />}
                </div>
                <span style={{ fontSize: 9, marginTop: 4, color: done || act ? COLORS.text : COLORS.muted, fontWeight: act ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>{step.label}</span>
                {i < INVOICE_STEPS.length - 1 && <div style={{ position: "absolute", top: 15, left: "calc(50% + 18px)", right: "calc(-50% + 18px)", height: 2.5, background: done ? COLORS.green : COLORS.border, transition: "background 0.3s", borderRadius: 1 }} />}
              </div>
            );
          })}
        </div>

        {/* Form content */}
        <div key={slideKey} style={{ background: COLORS.card, borderRadius: 18, padding: "26px 22px", boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 8px 28px rgba(0,0,0,.04)", border: `1px solid ${COLORS.border}`, animation: slideDirection > 0 ? "slideInRight 0.3s ease" : slideDirection < 0 ? "slideInLeft 0.3s ease" : "fadeIn 0.3s ease" }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          {currentStep > 1 && <button onClick={() => navStep(-1)} style={s.outBtn} type="button"><ChevronLeft size={17} /> Back</button>}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: COLORS.muted, display: "flex", alignItems: "center", gap: 5 }}><Receipt size={13} /> {currentStep}/4</span>
          <div style={{ flex: 1 }} />
          {currentStep < 4 && <button onClick={() => navStep(1)} style={s.accentBtn} type="button">Continue <ChevronRight size={17} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ═════ STYLES ═════ */
const s = {
  root: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Outfit',sans-serif", color: COLORS.text, position: "relative", overflow: "hidden" },
  bgDots: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(${COLORS.border}80 1px,transparent 1px)`, backgroundSize: "22px 22px", opacity: 0.5, pointerEvents: "none" },
  container: { position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "20px 16px 50px" },
  grid: { display: "flex", flexWrap: "wrap", gap: 14 },
  sumCard: { background: COLORS.inputBg, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.border}` },
  addBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%", padding: 16, borderRadius: 12, border: `2px dashed ${COLORS.accent}50`, background: `${COLORS.accentBg}50`, color: COLORS.accent, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  accentBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: COLORS.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 2px 10px ${COLORS.accent}30` },
  outBtn: { display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 10, background: "transparent", border: `1.5px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  darkBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "13px 20px", borderRadius: 10, background: COLORS.primary, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  iconBtn: { background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 8, cursor: "pointer", color: COLORS.muted, display: "flex", alignItems: "center" },
};
