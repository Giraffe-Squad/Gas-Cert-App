/* ═══════════════════════════════════════════════════════════════
   EMAIL SERVICE
   Sends certificate/invoice PDFs via the Vercel API route.
   
   Setup:
   1. Sign up at https://resend.com (free: 100 emails/day)
   2. Add RESEND_API_KEY to Vercel environment variables
   3. Verify your sending domain in Resend dashboard
      (or use onboarding@resend.dev for testing)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Send a PDF to one or more recipients.
 *
 * @param {Object} opts
 * @param {string[]} opts.to        — array of email addresses
 * @param {string}   opts.subject   — email subject
 * @param {string}   opts.html      — email body HTML
 * @param {string}   opts.pdfBase64 — base64-encoded PDF content
 * @param {string}   opts.pdfName   — filename for the attachment
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendPdfEmail({ to, subject, html, pdfBase64, pdfName }) {
  try {
    const resp = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html, pdfBase64, pdfName }),
    });

    const result = await resp.json();
    if (!resp.ok) {
      return { success: false, message: result.error || "Email failed" };
    }
    return { success: true, message: result.message || "Email sent" };
  } catch (err) {
    console.error("Email service error:", err);
    return { success: false, message: "Network error — please try again" };
  }
}

/**
 * Send a certificate PDF to landlord and/or engineer.
 */
export async function emailCertificate(cert, pdfDoc) {
  const pdfBase64 = pdfDoc.output("datauristring").split(",")[1];
  const pdfName = `CP12-${cert.certNo || cert.id}.pdf`;
  const recipients = [];

  if (cert.ll?.email) recipients.push(cert.ll.email);
  if (cert.eng?.email) recipients.push(cert.eng.email);

  if (recipients.length === 0) {
    return { success: false, message: "No email addresses found on certificate" };
  }

  const propertyAddr = [cert.prop?.address, cert.prop?.postcode].filter(Boolean).join(", ");
  const subject = `Gas Safety Certificate (CP12) — ${propertyAddr || "Certificate " + cert.certNo}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Gas Safety Certificate</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 14px;">CP12 — Landlord Gas Safety Record</p>
      </div>
      <div style="background: #ffffff; padding: 28px 30px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 15px; color: #2d3748; line-height: 1.7; margin: 0 0 16px;">
          Please find attached the gas safety certificate for:
        </p>
        <div style="background: #f7fafc; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 6px; font-size: 13px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Property</p>
          <p style="margin: 0; font-size: 15px; color: #1a1a2e; font-weight: 600;">${propertyAddr || "—"}</p>
        </div>
        <div style="display: flex; gap: 16px; margin-bottom: 20px;">
          <div style="flex: 1; background: #f7fafc; border-radius: 8px; padding: 12px 16px;">
            <p style="margin: 0 0 4px; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Certificate No.</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${cert.certNo || "—"}</p>
          </div>
          <div style="flex: 1; background: #f7fafc; border-radius: 8px; padding: 12px 16px;">
            <p style="margin: 0 0 4px; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Inspection Date</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${cert.inspDate || "—"}</p>
          </div>
        </div>
        <p style="font-size: 13px; color: #718096; line-height: 1.6; margin: 0;">
          Engineer: ${cert.eng?.name || "—"} · Gas Safe Reg: ${cert.eng?.gasSafe || "—"}
        </p>
      </div>
      <div style="background: #f7fafc; padding: 16px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 11px; color: #a0aec0; margin: 0; text-align: center;">
          Sent via Gas Safety Certificates App
        </p>
      </div>
    </div>
  `;

  return sendPdfEmail({ to: recipients, subject, html, pdfBase64, pdfName });
}

/**
 * Send an invoice PDF to the customer.
 */
export async function emailInvoice(invoice, pdfDoc) {
  const pdfBase64 = pdfDoc.output("datauristring").split(",")[1];
  const pdfName = `Invoice-${invoice.invoiceNo || invoice.id}.pdf`;

  const recipient = invoice.customer?.email;
  if (!recipient) {
    return { success: false, message: "No customer email address found" };
  }

  const subject = `Invoice ${invoice.invoiceNo || ""} from ${invoice.business?.name || "Gas Services"}`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; padding: 24px 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Invoice ${invoice.invoiceNo || ""}</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 14px;">${invoice.business?.name || ""}</p>
      </div>
      <div style="background: #ffffff; padding: 28px 30px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 15px; color: #2d3748; line-height: 1.7; margin: 0 0 16px;">
          Dear ${invoice.customer?.name || "Customer"},
        </p>
        <p style="font-size: 15px; color: #2d3748; line-height: 1.7; margin: 0 0 20px;">
          Please find your invoice attached.
        </p>
        <div style="background: #f7fafc; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0 0 4px; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Date</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${invoice.invoiceDate || "—"}</p>
          ${invoice.dueDate ? `
          <p style="margin: 10px 0 4px; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.5px;">Due Date</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a2e;">${invoice.dueDate}</p>
          ` : ""}
        </div>
      </div>
      <div style="background: #f7fafc; padding: 16px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 11px; color: #a0aec0; margin: 0; text-align: center;">
          Sent via Gas Safety Certificates App
        </p>
      </div>
    </div>
  `;

  return sendPdfEmail({ to: [recipient], subject, html, pdfBase64, pdfName });
}
