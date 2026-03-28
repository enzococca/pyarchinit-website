import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Static YouTube videos - fill in real URLs after scraping the channel
const youtubeVideos = [
  {
    title: "pyArchInit - Installazione e Configurazione",
    url: "https://www.youtube.com/watch?v=placeholder1",
    type: "video" as const,
  },
  {
    title: "pyArchInit - Gestione Unità Stratigrafiche",
    url: "https://www.youtube.com/watch?v=placeholder2",
    type: "video" as const,
  },
  {
    title: "pyArchInit - Import/Export GIS",
    url: "https://www.youtube.com/watch?v=placeholder3",
    type: "video" as const,
  },
  {
    title: "pyArchInit - Matrice di Harris",
    url: "https://www.youtube.com/watch?v=placeholder4",
    type: "video" as const,
  },
  {
    title: "pyArchInit - Fotogrammetria e Structure from Motion",
    url: "https://www.youtube.com/watch?v=placeholder5",
    type: "video" as const,
  },
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
