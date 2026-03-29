export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { BlockRenderer } from "@/components/public/block-renderer";
import type { Block } from "@/lib/blocks";
import { getServerLocale, t } from "@/lib/i18n";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } });
  if (!post) return {};
  return {
    title: `${post.title} | Blog | pyArchInit`,
    description: post.excerpt ?? undefined,
    openGraph: post.coverImage
      ? { images: [{ url: post.coverImage }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const [post, locale] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { slug: params.slug, status: "PUBLISHED" },
    }),
    getServerLocale(),
  ]);

  if (!post) notFound();

  const blocks = Array.isArray(post.blocks) ? (post.blocks as unknown as Block[]) : [];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-sand/50 hover:text-sand transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        {t(locale, "blog.back")}
      </Link>

      {post.coverImage && (
        <div className="relative aspect-video rounded-card overflow-hidden mb-8">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-4 leading-tight">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-sand/60 text-lg leading-relaxed mb-4">{post.excerpt}</p>
        )}
        {post.publishedAt && (
          <time className="text-sm text-sand/30">
            {new Date(post.publishedAt).toLocaleDateString(
              locale === "en" ? "en-GB" : "it-IT",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </time>
        )}
      </header>

      <BlockRenderer blocks={blocks} />
    </main>
  );
}
