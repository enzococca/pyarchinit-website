/**
 * Import pyArchInit tutorial docs from the QGIS plugin folder.
 * Run with: npx ts-node --project tsconfig.json scripts/import-docs.ts
 * Or call POST /api/docs/import from the admin panel.
 */

import fs from "fs";
import path from "path";
import { marked } from "marked";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TUTORIALS_DIR =
  "/Users/enzo/Library/Application Support/QGIS/QGIS3/profiles/default/python/plugins/pyarchinit/docs/tutorials/it";

function fixImagePaths(content: string): string {
  return content.replace(/!\[([^\]]*)\]\(images\//g, "![$1](/images/tutorials/");
}

function extractTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const base = path.basename(filename, ".md").replace(/^\d+_/, "");
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/_/g, " ");
}

function fileOrder(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : 999;
}

async function main() {
  const files = fs
    .readdirSync(TUTORIALS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort((a, b) => fileOrder(a) - fileOrder(b));

  console.log(`Found ${files.length} tutorial files`);

  const section = await prisma.docSection.upsert({
    where: { slug: "tutorial" },
    update: { title: "Tutorial", order: 1 },
    create: { title: "Tutorial", slug: "tutorial", order: 1 },
  });

  console.log(`Section: ${section.id}`);

  let imported = 0;
  for (const filename of files) {
    const filepath = path.join(TUTORIALS_DIR, filename);
    const rawContent = fs.readFileSync(filepath, "utf-8");

    const title = extractTitle(rawContent, filename);
    const fixedContent = fixImagePaths(rawContent);
    const htmlContent = await marked(fixedContent);

    const order = fileOrder(filename);
    const slugBase = path.basename(filename, ".md").replace(/_/g, "-").toLowerCase();
    const slug = `tutorial-${slugBase}`;

    await prisma.docPage.upsert({
      where: { slug },
      update: { title, content: htmlContent, order },
      create: { title, slug, content: htmlContent, order, sectionId: section.id },
    });

    console.log(`  [${order}] ${title} (${slug})`);
    imported++;
  }

  console.log(`\nImported ${imported} tutorials`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
