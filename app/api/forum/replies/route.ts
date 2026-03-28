import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { content, threadId } = await req.json();
  if (!content || !threadId) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
  if (!thread) {
    return NextResponse.json({ error: "Thread non trovato" }, { status: 404 });
  }
  if (thread.locked) {
    return NextResponse.json({ error: "Thread bloccato" }, { status: 403 });
  }

  const userId = (session.user as { id: string }).id;
  const reply = await prisma.forumReply.create({
    data: { content, threadId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // Bump thread updatedAt
  await prisma.forumThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() },
  });

  // Notify thread author if different from reply author
  if (thread.userId !== userId) {
    const [threadAuthor, replyAuthor] = await Promise.all([
      prisma.user.findUnique({ where: { id: thread.userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (threadAuthor?.email) {
      const siteUrl = process.env.NEXTAUTH_URL ?? "https://pyarchinit.org";
      const threadUrl = `${siteUrl}/forum/thread/${thread.slug}`;
      sendEmail({
        to: threadAuthor.email,
        subject: `Nuova risposta al tuo thread: ${thread.title}`,
        html: `
          <p style="color:#E8DCC8;margin-bottom:8px;">
            <strong style="color:#00D4AA;">${replyAuthor?.name ?? replyAuthor?.email ?? "Qualcuno"}</strong>
            ha risposto al tuo thread nel forum:
          </p>
          <blockquote style="border-left:3px solid #00D4AA;padding-left:16px;color:#8B7355;font-style:italic;margin:16px 0;">
            "${thread.title}"
          </blockquote>
          <a
            href="${threadUrl}"
            style="display:inline-block;background:#00D4AA;color:#0F1729;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;"
          >
            Vedi la risposta
          </a>
        `,
      }).catch(console.error);
    }
  }

  return NextResponse.json(reply, { status: 201 });
}
