import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { marked } from "marked";
import fs from "fs";
import path from "path";

const TUTORIALS_DIR =
  "/Users/enzo/Library/Application Support/QGIS/QGIS3/profiles/default/python/plugins/pyarchinit/docs/tutorials/it";

function fixImagePaths(content: string): string {
  // Replace relative image paths like images/XX_name/ with /images/tutorials/XX_name/
  return content.replace(/!\[([^\]]*)\]\(images\//g, "![$1](/images/tutorials/");
}

function extractTitle(content: string, filename: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  // Fallback: derive from filename (e.g. "01_configurazione" → "Configurazione")
  const base = path.basename(filename, ".md").replace(/^\d+_/, "");
  return base.charAt(0).toUpperCase() + base.slice(1).replace(/_/g, " ");
}

function fileOrder(filename: string): number {
  const match = filename.match(/^(\d+)_/);
  return match ? parseInt(match[1], 10) : 999;
}

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read all .md files from the tutorials directory
  let files: string[];
  try {
    files = fs
      .readdirSync(TUTORIALS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort((a, b) => fileOrder(a) - fileOrder(b));
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot read tutorials directory: ${err}` },
      { status: 500 }
    );
  }

  // Upsert the "Tutorial" DocSection
  const section = await prisma.docSection.upsert({
    where: { slug: "tutorial" },
    update: { title: "Tutorial", order: 1 },
    create: { title: "Tutorial", slug: "tutorial", order: 1 },
  });

  let imported = 0;
  const errors: string[] = [];

  for (const filename of files) {
    try {
      const filepath = path.join(TUTORIALS_DIR, filename);
      const rawContent = fs.readFileSync(filepath, "utf-8");

      const title = extractTitle(rawContent, filename);
      const fixedContent = fixImagePaths(rawContent);
      const htmlContent = await marked(fixedContent);

      const order = fileOrder(filename);
      // Slug: strip leading number and underscores, use filename base
      const slugBase = path.basename(filename, ".md").replace(/_/g, "-").toLowerCase();
      const slug = `tutorial-${slugBase}`;

      await prisma.docPage.upsert({
        where: { slug },
        update: {
          title,
          content: htmlContent,
          order,
        },
        create: {
          title,
          slug,
          content: htmlContent,
          order,
          sectionId: section.id,
        },
      });

      imported++;
    } catch (err) {
      errors.push(`${filename}: ${err}`);
    }
  }

  return NextResponse.json({ imported, errors, section: section.id });
}
