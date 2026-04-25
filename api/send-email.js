/* ═══════════════════════════════════════════════════════════════
   VERCEL API ROUTE — /api/send-email
   Sends emails with PDF attachments using Resend.
   
   Required env var: RESEND_API_KEY
   
   Place this file at: api/send-email.js (project root)
   ═══════════════════════════════════════════════════════════════ */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Email service not configured. Add RESEND_API_KEY to Vercel environment variables.",
    });
  }

  const { to, subject, html, pdfBase64, pdfName } = req.body;

  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: "No recipients specified" });
  }
  if (!pdfBase64) {
    return res.status(400).json({ error: "No PDF content provided" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Gas Safety Certs <onboarding@resend.dev>",
        to,
        subject: subject || "Gas Safety Certificate",
        html: html || "<p>Please find the attached document.</p>",
        attachments: [
          {
            filename: pdfName || "document.pdf",
            content: pdfBase64,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", data);
      return res.status(response.status).json({
        error: data.message || "Failed to send email",
      });
    }

    return res.status(200).json({
      message: `Email sent to ${to.join(", ")}`,
      id: data.id,
    });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
