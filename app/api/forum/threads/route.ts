import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { ensureThreadSubscription, notifyNewThread } from "@/lib/forum-notify";

const PAGE_SIZE = 20;

function makeSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const where = categorySlug
    ? { category: { slug: categorySlug } }
    : {};

  const [threads, total] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: true,
        _count: { select: { replies: true } },
      },
    }),
    prisma.forumThread.count({ where }),
  ]);

  return NextResponse.json({ threads, total, page, pages: Math.ceil(total / PAGE_SIZE) });
}


export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { title, content, categoryId } = await req.json();
  if (!title || !content || !categoryId) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const baseSlug = makeSlug(title);
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const existing = await prisma.forumThread.findUnique({ where: { slug } });
    if (!existing) break;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const userId = (session.user as { id: string }).id;

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true } });
  if (me?.banned) {
    return NextResponse.json(
      { error: "Sei stato escluso dal forum e non puoi pubblicare." },
      { status: 403 }
    );
  }

  const thread = await prisma.forumThread.create({
    data: { title, slug, content, categoryId, userId },
    include: { category: true },
  });

  // Auto-follow: il creatore segue il proprio thread (per le risposte future)
  await ensureThreadSubscription(userId, thread.id).catch(console.error);

  // Notifica (in background) i follower della categoria, tranne il creatore
  notifyNewThread({
    categoryId,
    threadTitle: thread.title,
    threadSlug: thread.slug,
    threadContent: content,
    authorId: userId,
    authorName: (session.user as { name?: string | null }).name ?? "Qualcuno",
  }).catch(console.error);

  return NextResponse.json(thread, { status: 201 });
}
