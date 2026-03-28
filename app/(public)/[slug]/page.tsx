export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { BlockRenderer } from "@/components/public/block-renderer";
import type { Block } from "@/lib/blocks";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page) return {};
  return {
    title: `${page.title} | pyArchInit`,
  };
}

export default async function CmsPage({ params }: Props) {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug, status: "PUBLISHED" },
  });

  if (!page) notFound();

  const blocks = Array.isArray(page.blocks) ? (page.blocks as unknown as Block[]) : [];

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-10">
        {page.title}
      </h1>
      <BlockRenderer blocks={blocks} />
    </main>
  );
}
