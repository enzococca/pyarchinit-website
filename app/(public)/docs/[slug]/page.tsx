import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.docPage.findUnique({
    where: { slug: params.slug },
    include: { section: true },
  });
  if (!page) return {};
  return {
    title: `${page.title} | Documentazione | pyArchInit`,
    description: `${page.section.title} — ${page.title}`,
  };
}

export default async function DocPageDetail({ params }: Props) {
  const page = await prisma.docPage.findUnique({
    where: { slug: params.slug },
    include: { section: true },
  });

  if (!page) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-sm text-sand/50 hover:text-sand transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Documentazione
      </Link>

      <div className="mb-2">
        <span className="text-xs font-mono text-teal uppercase tracking-widest">
          {page.section.title}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-mono font-bold text-sand mb-10">
        {page.title}
      </h1>

      <div
        className="prose prose-invert max-w-none prose-headings:font-mono prose-headings:text-teal prose-p:text-sand/80 prose-a:text-teal prose-strong:text-sand prose-code:text-teal prose-pre:bg-code-bg prose-li:text-sand/70"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />

      <div className="mt-12 pt-6 border-t border-sand/10 flex items-center justify-between text-xs text-sand/30">
        <span>
          Aggiornato il{" "}
          {new Date(page.updatedAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <a
          href="https://github.com/pyarchinit"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-sand transition-colors"
        >
          Modifica su GitHub
        </a>
      </div>
    </main>
  );
}
