/* ═══════════════════════════════════════════════════════════════
   INVOICE PDF GENERATOR
   Uses jsPDF to create professional plumbing/gas invoices
   ═══════════════════════════════════════════════════════════════ */
import { jsPDF } from "jspdf";
import { calcInvoiceTotals } from "./data";

const C = {
  primary: "#1a1a2e",
  accent: "#e65100",
  text: "#2d3748",
  muted: "#718096",
  border: "#e2e8f0",
  headerBg: "#1a1a2e",
  accentBg: "#fff3e0",
  white: "#ffffff",
  lightGray: "#f7fafc",
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function generateInvoicePDF(invoice, download = true) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = 210, ph = 297;
  const ml = 15, mr = 15, mt = 15;
  const cw = pw - ml - mr;
  let y = mt;

  const setColor = (hex) => doc.setTextColor(...hexToRgb(hex));
  const drawRect = (x, yy, w, h, hex) => {
    doc.setFillColor(...hexToRgb(hex));
    doc.rect(x, yy, w, h, "F");
  };
  const drawLine = (x1, y1, x2, y2, hex = C.border) => {
    doc.setDrawColor(...hexToRgb(hex));
    doc.setLineWidth(0.3);
    doc.line(x1, y1, x2, y2);
  };

  const fmt = (n) => "£" + parseFloat(n || 0).toFixed(2);
  const { subtotal, vatAmount, total } = calcInvoiceTotals(invoice);

  // ─── Header bar with company name prominently ───
  drawRect(0, 0, pw, 46, C.headerBg);

  // Big bold company name in orange — the main visual anchor
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setColor(C.accent);
  doc.text("MEDIUMLINK UK LTD", ml, 19);

  // Orange accent line under company name
  drawRect(ml, 23, 55, 1.2, C.accent);

  // Smaller "INVOICE" label below
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor("#ffffffaa");
  doc.text("INVOICE", ml, 31);

  // Invoice details
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  setColor("#ffffff80");
  doc.text(`No: ${invoice.invoiceNo || "—"}`, ml, 38);
  doc.text(`Date: ${invoice.invoiceDate || "—"}`, ml + 40, 38);

  // Due date on right side
  if (invoice.dueDate) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(C.white);
    doc.text(`Due: ${invoice.dueDate}`, pw - mr, 31, { align: "right" });
  }

  y = 56;

  // ─── Business / Customer columns ───
  const colW = (cw - 10) / 2;

  // FROM
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(C.accent);
  doc.text("FROM", ml, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(C.primary);
  doc.text(invoice.business?.name || "—", ml, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(C.text);
  const bAddr = [invoice.business?.address, invoice.business?.city, invoice.business?.postcode].filter(Boolean).join(", ");
  if (bAddr) { doc.text(bAddr, ml, y); y += 4; }
  if (invoice.business?.phone) { doc.text(`Tel: ${invoice.business.phone}`, ml, y); y += 4; }
  if (invoice.business?.email) { doc.text(invoice.business.email, ml, y); y += 4; }

  // TO
  let y2 = 56;
  const rightX = ml + colW + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(C.accent);
  doc.text("BILL TO", rightX, y2);
  y2 += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(C.primary);
  doc.text(invoice.customer?.name || "—", rightX, y2);
  y2 += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(C.text);
  if (invoice.customer?.company) { doc.text(invoice.customer.company, rightX, y2); y2 += 4; }
  const cAddr = [invoice.customer?.address, invoice.customer?.city, invoice.customer?.postcode].filter(Boolean).join(", ");
  if (cAddr) { doc.text(cAddr, rightX, y2); y2 += 4; }
  if (invoice.customer?.phone) { doc.text(`Tel: ${invoice.customer.phone}`, rightX, y2); y2 += 4; }
  if (invoice.customer?.email) { doc.text(invoice.customer.email, rightX, y2); y2 += 4; }

  y = Math.max(y, y2) + 10;

  // ─── Line items table ───
  const colDesc = ml;
  const colQty = ml + cw - 75;
  const colRate = ml + cw - 50;
  const colAmt = ml + cw - 25;
  const tableRight = ml + cw;

  // Table header
  drawRect(ml, y, cw, 9, C.headerBg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(C.white);
  doc.text("DESCRIPTION", colDesc + 4, y + 6);
  doc.text("QTY", colQty, y + 6, { align: "right" });
  doc.text("RATE", colRate, y + 6, { align: "right" });
  doc.text("AMOUNT", tableRight - 4, y + 6, { align: "right" });
  y += 9;

  // Table rows
  const items = invoice.items || [];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  items.forEach((item, idx) => {
    if (y > ph - 60) {
      doc.addPage();
      y = mt;
    }
    const rowBg = idx % 2 === 0 ? C.white : C.lightGray;
    drawRect(ml, y, cw, 8, rowBg);
    setColor(C.text);
    const desc = item.description || "—";
    const maxDescW = colQty - colDesc - 30;
    const truncDesc = doc.getStringUnitWidth(desc) * 9 / doc.internal.scaleFactor > maxDescW
      ? desc.substring(0, 40) + "…" : desc;
    doc.text(truncDesc, colDesc + 4, y + 5.5);
    doc.text(String(item.quantity || 0), colQty, y + 5.5, { align: "right" });
    doc.text(fmt(item.rate), colRate, y + 5.5, { align: "right" });
    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    doc.text(fmt(lineTotal), tableRight - 4, y + 5.5, { align: "right" });
    y += 8;
  });

  drawLine(ml, y, ml + cw, y, C.border);
  y += 6;

  // ─── Totals ───
  const totX = ml + cw - 70;
  const totValX = ml + cw - 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(C.muted);
  doc.text("Subtotal:", totX, y);
  setColor(C.text);
  doc.text(fmt(subtotal), totValX, y, { align: "right" });
  y += 6;

  if (parseFloat(invoice.vatRate) > 0) {
    setColor(C.muted);
    doc.text(`VAT (${invoice.vatRate}%):`, totX, y);
    setColor(C.text);
    doc.text(fmt(vatAmount), totValX, y, { align: "right" });
    y += 6;
  }

  drawLine(totX, y, totValX, y, C.primary);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(C.primary);
  doc.text("TOTAL:", totX, y);
  doc.text(fmt(total), totValX, y, { align: "right" });
  y += 12;

  // ─── Payment details ───
  if (invoice.paymentDetails) {
    drawRect(ml, y, cw, 1, C.accent);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(C.accent);
    doc.text("PAYMENT DETAILS", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(C.text);
    const payLines = doc.splitTextToSize(invoice.paymentDetails, cw);
    doc.text(payLines, ml, y);
    y += payLines.length * 4 + 6;
  }

  // ─── Notes ───
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(C.accent);
    doc.text("NOTES", ml, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(C.muted);
    const noteLines = doc.splitTextToSize(invoice.notes, cw);
    doc.text(noteLines, ml, y);
    y += noteLines.length * 4 + 4;
  }

  // ─── Footer ───
  doc.setFontSize(7);
  setColor(C.muted);
  doc.text("Thank you for your business  ·  Mediumlink UK Ltd", pw / 2, ph - 10, { align: "center" });

  if (download) {
    const name = `Invoice-${invoice.invoiceNo || invoice.id}.pdf`;
    doc.save(name);
  }
  return doc;
}
