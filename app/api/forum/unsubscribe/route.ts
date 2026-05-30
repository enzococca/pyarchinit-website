import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function page(message: string): NextResponse {
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>pyArchInit — Disiscrizione</title></head>
<body style="margin:0;background:#0F1729;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:520px;margin:80px auto;padding:32px;background:#1A1E2E;border-radius:12px;text-align:center;">
    <h1 style="color:#00D4AA;font-size:20px;margin:0 0 16px;">pyArchInit</h1>
    <p style="color:#E8DCC8;font-size:15px;line-height:1.6;">${message}</p>
    <a href="${process.env.NEXTAUTH_URL ?? "https://pyarchinit.org"}/forum" style="display:inline-block;margin-top:24px;color:#00D4AA;text-decoration:none;">← Torna al forum</a>
  </div>
</body></html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return page("Link non valido.");

  const thread = await prisma.threadSubscription.findUnique({ where: { unsubscribeToken: token } });
  if (thread) {
    await prisma.threadSubscription.delete({ where: { id: thread.id } });
    return page("Non seguirai più questa discussione. Non riceverai altre email a riguardo.");
  }

  const category = await prisma.categorySubscription.findUnique({ where: { unsubscribeToken: token } });
  if (category) {
    await prisma.categorySubscription.delete({ where: { id: category.id } });
    return page("Non seguirai più questa categoria. Non riceverai altre email a riguardo.");
  }

  return page("Questa sottoscrizione non esiste più (forse ti eri già disiscritto).");
}
