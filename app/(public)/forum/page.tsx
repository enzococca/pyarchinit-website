import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Forum | pyArchInit",
  description: "Forum della community pyArchInit: discussioni, supporto tecnico e showcase di progetti.",
};

export const dynamic = "force-dynamic";

export default async function ForumPage() {
  const categories = await prisma.forumCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      threads: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          user: { select: { name: true } },
        },
      },
      _count: { select: { threads: true } },
    },
  });

  return (
    <main>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-[#0d1524] to-[#0a1020] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-teal font-mono text-sm tracking-widest uppercase mb-4">
            Community
          </p>
          <h1 className="text-4xl sm:text-5xl font-mono font-bold text-sand mb-4">
            Discussioni
          </h1>
          <p className="text-sand/60 text-lg max-w-xl">
            Fai domande, condividi progetti, proponi idee. La community di pyArchInit ti aspetta.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-mono text-sand/70">Categorie</h2>
          <Link
            href="/forum/nuovo"
            className="flex items-center gap-2 bg-teal text-primary px-4 py-2 rounded-card text-sm font-medium hover:bg-teal/90 transition"
          >
            <MessageSquare size={16} />
            Nuova Discussione
          </Link>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const latestThread = cat.threads[0];
            return (
              <Link
                key={cat.id}
                href={`/forum/${cat.slug}`}
                className="block bg-code-bg rounded-card border border-sand/10 hover:border-teal/20 transition p-5"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-sand font-mono font-semibold">{cat.name}</h3>
                      <span className="text-xs text-sand/40 shrink-0">
                        {cat._count.threads} {cat._count.threads === 1 ? "thread" : "thread"}
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-sand/50 mt-0.5">{cat.description}</p>
                    )}
                    {latestThread && (
                      <p className="text-xs text-sand/30 mt-2 truncate">
                        Ultimo: {latestThread.title}{" "}
                        <span className="text-sand/20">
                          — {new Date(latestThread.updatedAt).toLocaleDateString("it-IT")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
