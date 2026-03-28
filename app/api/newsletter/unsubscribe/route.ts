import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");

  if (!email) {
    return new NextResponse(renderPage("Errore", "Email non specificata."), {
      headers: { "Content-Type": "text/html" },
      status: 400,
    });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!subscriber) {
    return new NextResponse(
      renderPage("Non trovato", "Indirizzo email non trovato nella lista."),
      { headers: { "Content-Type": "text/html" }, status: 404 }
    );
  }

  if (subscriber.unsubscribedAt) {
    return new NextResponse(
      renderPage(
        "Già disiscritto",
        "Sei già stato rimosso dalla newsletter."
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: { unsubscribedAt: new Date() },
  });

  return new NextResponse(
    renderPage(
      "Disiscrizione completata",
      "Sei stato rimosso con successo dalla newsletter di pyArchInit."
    ),
    { headers: { "Content-Type": "text/html" } }
  );
}

function renderPage(title: string, message: string): string {
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - pyArchInit</title>
</head>
<body style="margin:0;padding:0;background:#0F1729;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:480px;text-align:center;padding:32px;">
    <h1 style="font-family:'JetBrains Mono',monospace;color:#00D4AA;font-size:24px;margin-bottom:16px;">pyArchInit</h1>
    <div style="background:#1A1E2E;border-radius:12px;padding:32px;">
      <h2 style="color:#E8DCC8;font-size:20px;margin-top:0;">${title}</h2>
      <p style="color:#8B7355;font-size:15px;">${message}</p>
      <a href="${siteUrl}" style="display:inline-block;margin-top:16px;background:#00D4AA;color:#0F1729;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Torna al sito
      </a>
    </div>
  </div>
</body>
</html>`;
}
