import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Skip if SMTP not configured
  if (!process.env.SMTP_HOST) {
    console.log(`[Email skipped - no SMTP] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: `"pyArchInit" <${process.env.SMTP_USER || "noreply@pyarchinit.org"}>`,
    to,
    subject,
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
        <h2 style="color:#E8DCC8;font-size:18px;margin-top:0;">${title}</h2>
        ${content}
      </div>
      <div style="text-align:center;margin-top:24px;color:#8B7355;font-size:12px;">
        <p>pyArchInit - Piattaforma Open Source per l'Archeologia</p>
        <p><a href="${process.env.NEXTAUTH_URL || 'https://pyarchinit.org'}" style="color:#00D4AA;">pyarchinit.org</a></p>
      </div>
    </div>
  `;
}
