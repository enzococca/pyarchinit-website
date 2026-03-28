import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { ChevronLeft, Eye, MessageSquare, Pin, Lock } from "lucide-react";
import { ReplyForm } from "./ReplyForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const thread = await prisma.forumThread.findUnique({ where: { slug }, select: { title: true } });
  if (!thread) return { title: "Forum | pyArchInit" };
  return { title: `${thread.title} | Forum | pyArchInit` };
}

export default async function ThreadPage({ params }: Props) {
  const { slug } = await params;

  const thread = await prisma.forumThread.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, email: true } },
      category: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!thread) notFound();

  // Increment view count
  prisma.forumThread.update({
    where: { id: thread.id },
    data: { views: { increment: 1 } },
  }).catch(() => {});

  const session = await getSession();
  const isLoggedIn = !!session?.user;

  function getInitial(user: { name?: string | null; email: string }) {
    return (user.name ?? user.email).charAt(0).toUpperCase();
  }

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href="/forum"
              className="text-teal/70 hover:text-teal text-sm transition"
            >
              Forum
            </Link>
            <span className="text-sand/30">/</span>
            <Link
              href={`/forum/${thread.category.slug}`}
              className="text-teal/70 hover:text-teal text-sm transition"
            >
              {thread.category.name}
            </Link>
          </div>
          <div className="flex items-start gap-3 mb-3">
            {thread.pinned && <Pin size={18} className="text-teal mt-1 shrink-0" />}
            {thread.locked && <Lock size={18} className="text-ochre mt-1 shrink-0" />}
            <h1 className="text-2xl sm:text-3xl font-mono font-bold text-sand">
              {thread.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs text-sand/40">
            <span>{thread.user.name ?? thread.user.email}</span>
            <span>{new Date(thread.createdAt).toLocaleDateString("it-IT")}</span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {thread.views}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare size={12} />
              {thread.replies.length}
            </span>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Thread content */}
        <div className="bg-code-bg rounded-card border border-sand/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-teal/20 flex items-center justify-center text-teal font-mono font-bold text-sm">
              {getInitial(thread.user)}
            </div>
            <div>
              <p className="text-sm font-medium text-sand">{thread.user.name ?? "Utente"}</p>
              <p className="text-xs text-sand/40">
                {new Date(thread.createdAt).toLocaleString("it-IT")}
              </p>
            </div>
          </div>
          <div
            className="prose prose-invert prose-sm max-w-none text-sand/80 whitespace-pre-wrap"
          >
            {thread.content}
          </div>
        </div>

        {/* Replies */}
        {thread.replies.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-mono text-sand/50 uppercase tracking-widest">
              {thread.replies.length} {thread.replies.length === 1 ? "risposta" : "risposte"}
            </h2>
            {thread.replies.map((reply) => (
              <div
                key={reply.id}
                className="bg-code-bg rounded-card border border-sand/10 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-ochre/20 flex items-center justify-center text-ochre font-mono font-bold text-sm">
                    {getInitial(reply.user)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sand">{reply.user.name ?? "Utente"}</p>
                    <p className="text-xs text-sand/40">
                      {new Date(reply.createdAt).toLocaleString("it-IT")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-sand/80 whitespace-pre-wrap">{reply.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reply form or login prompt */}
        <div className="pt-4 border-t border-sand/10">
          {isLoggedIn ? (
            <ReplyForm threadId={thread.id} locked={thread.locked} />
          ) : (
            <div className="bg-code-bg rounded-card border border-sand/10 px-5 py-4 text-center">
              <p className="text-sm text-sand/60 mb-3">
                Devi essere autenticato per rispondere.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center px-4 py-2 bg-teal text-primary rounded-card text-sm font-medium hover:bg-teal/90 transition"
              >
                Accedi per rispondere
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
