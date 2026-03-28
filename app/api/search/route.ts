import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Real YouTube videos from @pyarchinit channel
const youtubeVideos = [
  { title: "pyArchInit - Nuovo sistema simboli per USM", url: "https://www.youtube.com/watch?v=UjJOEty0vSI" },
  { title: "Gestione alzati pyarchinitGoes2Blend3D", url: "https://www.youtube.com/watch?v=UwvDLGMD80s" },
  { title: "Come spostare i punti da coordinate relative ad assolute sfruttando il Segnalibro", url: "https://www.youtube.com/watch?v=sKZwFFI6TxQ" },
  { title: "Drone Unit for pyArchInit", url: "https://www.youtube.com/watch?v=06CZCq4cREI" },
  { title: "pyArchInit - Tafonomia", url: "https://www.youtube.com/watch?v=tQfZ2kxicY0" },
  { title: "pyArchInit - Strutture e ipotesi", url: "https://www.youtube.com/watch?v=e3jCS17g43s" },
  { title: "pyArchInit - Campioni", url: "https://www.youtube.com/watch?v=w-VOrRgGcfw" },
  { title: "pyArchInit - Reperti", url: "https://www.youtube.com/watch?v=v4G03oX9SCM" },
  { title: "I layer pyunitastratigrafiche e pyarchinit_quote", url: "https://www.youtube.com/watch?v=_n_O6TCdObY" },
  { title: "Layer pyarchinit_sezioni", url: "https://www.youtube.com/watch?v=sfW7xOsmLFc" },
  { title: "Layer pyarchinit_sondaggi", url: "https://www.youtube.com/watch?v=naCytTz0sSk" },
  { title: "Layer pyarchinit_individui", url: "https://www.youtube.com/watch?v=388hhkz55EY" },
  { title: "Layer pyarchinit_siti (puntuali e poligonali)", url: "https://www.youtube.com/watch?v=AQFYxNg4Agc" },
  { title: "Layer pyarchinit_punti_rif", url: "https://www.youtube.com/watch?v=SU1hJatrf0E" },
  { title: "Layer pyarchinit_linee_riferimento", url: "https://www.youtube.com/watch?v=BbnLfQDfkxg" },
];

export interface SearchResult {
  id: string;
  type: "doc" | "course" | "blog" | "forum" | "video";
  title: string;
  breadcrumb: string;
  href: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    // Return suggested items when query is empty
    const [latestCourses, topDocs] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, slug: true, category: true },
      }),
      prisma.docPage.findMany({
        orderBy: { order: "asc" },
        take: 4,
        select: {
          id: true,
          title: true,
          slug: true,
          section: { select: { title: true } },
        },
      }),
    ]);

    const results: SearchResult[] = [
      ...topDocs.map((p) => ({
        id: p.id,
        type: "doc" as const,
        title: p.title,
        breadcrumb: `Documentazione > ${p.section.title}`,
        href: `/docs/${p.slug}`,
      })),
      ...latestCourses.map((c) => ({
        id: c.id,
        type: "course" as const,
        title: c.title,
        breadcrumb: `Corsi > ${c.category}`,
        href: `/corsi/${c.slug}`,
      })),
    ];

    return NextResponse.json({ results, query: "", total: results.length } satisfies SearchResponse);
  }

  const [docs, courses, blogPosts, forumThreads] = await Promise.all([
    prisma.docPage.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        section: { select: { title: true } },
      },
    }),
    prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true, slug: true, category: true },
    }),
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        title: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
    prisma.forumThread.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        category: { select: { name: true } },
      },
    }),
  ]);

  // Filter YouTube videos by query (client-side on the static array)
  const matchedVideos = youtubeVideos.filter((v) =>
    v.title.toLowerCase().includes(q.toLowerCase())
  );

  const results: SearchResult[] = [
    ...docs.map((p) => ({
      id: p.id,
      type: "doc" as const,
      title: p.title,
      breadcrumb: `Documentazione > ${p.section.title}`,
      href: `/docs/${p.slug}`,
    })),
    ...courses.map((c) => ({
      id: c.id,
      type: "course" as const,
      title: c.title,
      breadcrumb: `Corsi > ${c.category}`,
      href: `/corsi/${c.slug}`,
    })),
    ...blogPosts.map((b) => ({
      id: b.id,
      type: "blog" as const,
      title: b.title,
      breadcrumb: "Blog",
      href: `/blog/${b.slug}`,
    })),
    ...forumThreads.map((t) => ({
      id: t.id,
      type: "forum" as const,
      title: t.title,
      breadcrumb: `Forum > ${t.category.name}`,
      href: `/forum/thread/${t.slug}`,
    })),
    ...matchedVideos.map((v, i) => ({
      id: `video-${i}`,
      type: "video" as const,
      title: v.title,
      breadcrumb: "YouTube",
      href: v.url,
    })),
  ];

  return NextResponse.json({
    results,
    query: q,
    total: results.length,
  } satisfies SearchResponse);
}
