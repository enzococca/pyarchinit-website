import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const data = await req.json();

  const slug = (data.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const project = await db.project.create({
    data: {
      title: data.title,
      slug: data.slug ?? slug,
      description: data.description ?? "",
      url: data.url ?? null,
      githubUrl: data.githubUrl ?? null,
      imageUrl: data.imageUrl ?? null,
      status: data.status ?? "active",
      category: data.category ?? null,
      order: data.order ?? 0,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
