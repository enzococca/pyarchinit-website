import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { marked } from "marked";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureUniqueSlug(base: string, existing: Set<string>): string {
  let slug = base;
  let counter = 1;
  while (existing.has(slug)) {
    slug = `${base}-${counter++}`;
  }
  existing.add(slug);
  return slug;
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  const body = await req.json();
  const sourceDir = body.sourceDir ?? "/tmp/course_db";

  if (!fs.existsSync(sourceDir)) {
    return NextResponse.json(
      { error: `Directory not found: ${sourceDir}` },
      { status: 400 }
    );
  }

  // Delete existing course with this slug to allow re-import
  const courseSlug = "database-e-sql";
  await prisma.interactiveCourse.deleteMany({ where: { slug: courseSlug } });

  const usedSlugs = new Set<string>();

  // Collect lesson files
  const lessonsDir = path.join(sourceDir, "lezioni");
  const labsDir = path.join(sourceDir, "laboratori");

  const lessonFiles = fs.existsSync(lessonsDir)
    ? fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md")).sort()
    : [];

  const labFiles = fs.existsSync(labsDir)
    ? fs.readdirSync(labsDir).filter((f) => f.endsWith(".md")).sort()
    : [];

  // Define 4 modules based on file groupings
  const moduleDefinitions = [
    {
      title: "Fondamenti di Database",
      lessonRange: [0, 2],
      labRange: [0, 1],
    },
    {
      title: "SQL Fondamentale",
      lessonRange: [2, 5],
      labRange: [1, 3],
    },
    {
      title: "Query Avanzate",
      lessonRange: [5, 8],
      labRange: [3, 5],
    },
    {
      title: "Database in Archeologia",
      lessonRange: [8, lessonFiles.length],
      labRange: [5, labFiles.length],
    },
  ];

  const course = await prisma.interactiveCourse.create({
    data: {
      title: "Database e SQL",
      slug: courseSlug,
      description:
        "Impara i fondamenti dei database relazionali e SQL applicati all'archeologia digitale. Dal modello entità-relazione alle query avanzate, con esercizi pratici su dati di scavo reali.",
      category: "database",
      difficulty: "beginner",
      published: true,
      order: 1,
    },
  });

  let globalLessonOrder = 0;

  for (let mi = 0; mi < moduleDefinitions.length; mi++) {
    const modDef = moduleDefinitions[mi];
    const module = await prisma.interactiveModule.create({
      data: { title: modDef.title, order: mi + 1, courseId: course.id },
    });

    // Add lessons
    const moduleLessons = lessonFiles.slice(modDef.lessonRange[0], modDef.lessonRange[1]);
    for (const filename of moduleLessons) {
      const filePath = path.join(lessonsDir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const html = await marked(raw);
      // Extract title from first heading or filename
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : filename.replace(/^\d+-/, "").replace(/-/g, " ").replace(".md", "");
      const baseSlug = slugify(`db-sql-${filename.replace(".md", "")}`);
      const slug = ensureUniqueSlug(baseSlug, usedSlugs);

      await prisma.interactiveLesson.create({
        data: {
          title,
          slug,
          type: "lesson",
          content: html,
          order: ++globalLessonOrder,
          moduleId: module.id,
        },
      });
    }

    // Add labs
    const moduleLabs = labFiles.slice(modDef.labRange[0], modDef.labRange[1]);
    for (const filename of moduleLabs) {
      const filePath = path.join(labsDir, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const html = await marked(raw);
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : filename.replace(/^\d+-/, "").replace(/-/g, " ").replace(".md", "");
      const baseSlug = slugify(`db-sql-lab-${filename.replace(".md", "")}`);
      const slug = ensureUniqueSlug(baseSlug, usedSlugs);

      await prisma.interactiveLesson.create({
        data: {
          title,
          slug,
          type: "lab",
          content: html,
          order: ++globalLessonOrder,
          moduleId: module.id,
        },
      });
    }
  }

  // Count imported lessons
  const totalModules = await prisma.interactiveModule.count({ where: { courseId: course.id } });
  const totalLessons = await prisma.interactiveLesson.count({
    where: { module: { courseId: course.id } },
  });

  return NextResponse.json({
    success: true,
    course: { id: course.id, slug: course.slug, title: course.title },
    modules: totalModules,
    lessons: totalLessons,
  });
}
