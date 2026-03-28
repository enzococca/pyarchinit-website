export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog | pyArchInit",
  description:
    "Articoli, notizie e aggiornamenti dal mondo dell'archeologia digitale e di pyArchInit.",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
    },
  });

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-mono font-bold text-sand mb-3">Blog</h1>
        <p className="text-sand/50 text-lg">
          Articoli e notizie dal mondo dell&apos;archeologia digitale.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-24 text-sand/30">
          <p className="text-lg">Nessun articolo pubblicato.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-code-bg rounded-card border border-sand/10 hover:border-teal/30 transition-colors overflow-hidden flex flex-col"
            >
              {post.coverImage ? (
                <div className="relative aspect-video">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-primary/50 flex items-center justify-center">
                  <span className="text-sand/20 font-mono text-xs">pyArchInit</span>
                </div>
              )}
              <div className="p-6 flex flex-col flex-1">
                <h2 className="font-mono font-bold text-sand text-lg mb-2 leading-snug">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-teal transition-colors"
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-sand/60 mb-4 flex-1 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-sand/10">
                  <time className="text-xs text-sand/30">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : ""}
                  </time>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs text-teal hover:text-teal/80 transition-colors"
                  >
                    Leggi &rarr;
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
