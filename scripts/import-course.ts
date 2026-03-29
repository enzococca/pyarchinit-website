/**
 * Import script for "Database e SQL" interactive course.
 *
 * Usage:
 *   npx tsx scripts/import-course.ts [sourceDir]
 *
 * Default sourceDir: /tmp/course_db
 * Expected structure:
 *   /tmp/course_db/lezioni/*.md   — lesson markdown files
 *   /tmp/course_db/laboratori/*.md — lab markdown files
 */

import { PrismaClient } from "@prisma/client";
import { marked } from "marked";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

async function main() {
  const sourceDir = process.argv[2] ?? "/tmp/course_db";

  console.log(`\nImporting from: ${sourceDir}`);

  if (!fs.existsSync(sourceDir)) {
    console.error(`ERROR: Directory not found: ${sourceDir}`);
    process.exit(1);
  }

  const lessonsDir = path.join(sourceDir, "lezioni");
  const labsDir = path.join(sourceDir, "laboratori");

  const lessonFiles = fs.existsSync(lessonsDir)
    ? fs.readdirSync(lessonsDir).filter((f) => f.endsWith(".md")).sort()
    : [];

  const labFiles = fs.existsSync(labsDir)
    ? fs.readdirSync(labsDir).filter((f) => f.endsWith(".md")).sort()
    : [];

  console.log(`Found ${lessonFiles.length} lessons, ${labFiles.length} labs`);

  // Delete existing
  const courseSlug = "database-e-sql";
  const existing = await prisma.interactiveCourse.findUnique({ where: { slug: courseSlug } });
  if (existing) {
    console.log("Deleting existing course...");
    await prisma.interactiveCourse.delete({ where: { slug: courseSlug } });
  }

  const usedSlugs = new Set<string>();

  // Define modules
  const moduleDefinitions = [
    { title: "Fondamenti di Database", lessonRange: [0, 2] as [number, number], labRange: [0, 1] as [number, number] },
    { title: "SQL Fondamentale", lessonRange: [2, 5] as [number, number], labRange: [1, 3] as [number, number] },
    { title: "Query Avanzate", lessonRange: [5, 8] as [number, number], labRange: [3, 5] as [number, number] },
    { title: "Database in Archeologia", lessonRange: [8, lessonFiles.length] as [number, number], labRange: [5, labFiles.length] as [number, number] },
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

  console.log(`Created course: ${course.title} (${course.id})`);

  let totalLessons = 0;

  for (let mi = 0; mi < moduleDefinitions.length; mi++) {
    const modDef = moduleDefinitions[mi];
    const module = await prisma.interactiveModule.create({
      data: { title: modDef.title, order: mi + 1, courseId: course.id },
    });
    console.log(`  Module ${mi + 1}: ${module.title}`);

    const moduleLessons = lessonFiles.slice(modDef.lessonRange[0], modDef.lessonRange[1]);
    for (const filename of moduleLessons) {
      const raw = fs.readFileSync(path.join(lessonsDir, filename), "utf-8");
      const html = await marked(raw);
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : filename.replace(/^\d+-/, "").replace(/-/g, " ").replace(".md", "");
      const slug = ensureUniqueSlug(slugify(`db-sql-${filename.replace(".md", "")}`), usedSlugs);

      await prisma.interactiveLesson.create({
        data: { title, slug, type: "lesson", content: html, order: ++totalLessons, moduleId: module.id },
      });
      console.log(`    Lesson: ${title}`);
    }

    const moduleLabs = labFiles.slice(modDef.labRange[0], modDef.labRange[1]);
    for (const filename of moduleLabs) {
      const raw = fs.readFileSync(path.join(labsDir, filename), "utf-8");
      const html = await marked(raw);
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : filename.replace(/^\d+-/, "").replace(/-/g, " ").replace(".md", "");
      const slug = ensureUniqueSlug(slugify(`db-sql-lab-${filename.replace(".md", "")}`), usedSlugs);

      await prisma.interactiveLesson.create({
        data: { title, slug, type: "lab", content: html, order: ++totalLessons, moduleId: module.id },
      });
      console.log(`    Lab: ${title}`);
    }
  }

  console.log(`\nDone! Imported ${totalLessons} lessons/labs across ${moduleDefinitions.length} modules.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
