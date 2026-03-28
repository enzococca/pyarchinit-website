import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MessageSquare, Pin, Lock, Eye, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface Props {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = await prisma.forumCategory.findUnique({ where: { slug } });
  if (!cat) return { title: "Forum | pyArchInit" };
  return { title: `${cat.name} | Forum | pyArchInit` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category: slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const category = await prisma.forumCategory.findUnique({ where: { slug } });
  if (!category) notFound();

  const [threads, total] = await Promise.all([
    prisma.forumThread.findMany({
      where: { categoryId: category.id },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      skip,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.forumThread.count({ where: { categoryId: category.id } }),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/forum"
            className="inline-flex items-center gap-1 text-teal/70 hover:text-teal text-sm mb-4 transition"
          >
            <ChevronLeft size={14} />
            Forum
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand">
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-sand/60">{category.description}</p>
          )}
        </div>
      </section>

      {/* Thread list */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-sand/40">{total} thread</p>
          <Link
            href="/forum/nuovo"
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition"
          >
            <MessageSquare size={16} />
            Nuova Discussione
          </Link>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-20 text-sand/30">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nessun thread ancora. Sii il primo!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread/${thread.slug}`}
                className="flex items-center gap-4 bg-code-bg rounded-card border border-sand/10 hover:border-teal/20 transition px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {thread.pinned && (
                      <Pin size={12} className="text-teal shrink-0" />
                    )}
                    {thread.locked && (
                      <Lock size={12} className="text-ochre shrink-0" />
                    )}
                    <span className="text-sand text-sm font-medium truncate">
                      {thread.title}
                    </span>
                  </div>
                  <p className="text-xs text-sand/40">
                    {thread.user.name ?? "Utente"} &middot;{" "}
                    {new Date(thread.createdAt).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-xs text-sand/40">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {thread._count.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {thread.views}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {page > 1 && (
              <Link
                href={`/forum/${slug}?page=${page - 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-card border border-sand/20 text-sand/60 hover:border-sand/40 hover:text-sand text-sm transition"
              >
                <ChevronLeft size={14} />
                Precedente
              </Link>
            )}
            <span className="text-xs text-sand/40">
              {page} / {pages}
            </span>
            {page < pages && (
              <Link
                href={`/forum/${slug}?page=${page + 1}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-card border border-sand/20 text-sand/60 hover:border-sand/40 hover:text-sand text-sm transition"
              >
                Successiva
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
