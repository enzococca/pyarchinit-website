import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail({ to, subject, html, replyTo, headers }: EmailOptions) {
  if (!resend) {
    console.log(`[Email skipped - no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return;
  }

  const from = process.env.EMAIL_FROM || "pyArchInit <onboarding@resend.dev>";

  await resend.emails.send({
    from,
    to,
    subject,
    ...(replyTo ? { replyTo } : {}),
    ...(headers ? { headers } : {}),
    html: wrapInTemplate(subject, html),
  });
}

function wrapInTemplate(title: string, content: string): string {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:Inter,sans-serif;background:#0F1729;color:#E8DCC8;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="font-family:'JetBrains Mono',monospace;color:#00D4AA;font-size:20px;margin:0;">pyArchInit</h1>
      </div>
      <div style="background:#1A1E2E;border-radius:8px;padding:24px;">
        <h2 style="color:#E8DCC8;font-size:18px;margin-top:0;">${title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h2>
        ${content}
      </div>
      <div style="text-align:center;margin-top:24px;color:#8B7355;font-size:12px;">
        <p>pyArchInit - Piattaforma Open Source per l'Archeologia</p>
        <p><a href="https://pyarchinit.com" style="color:#00D4AA;">pyarchinit.com</a></p>
      </div>
    </div>
  `;
}
