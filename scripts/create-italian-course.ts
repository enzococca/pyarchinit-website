/**
 * Script to duplicate the 'database-sql-2025' Interactive Course
 * with Italian titles, creating 'database-sql-2025-it'.
 *
 * Run with:
 *   npx tsx scripts/create-italian-course.ts
 *
 * The SQL/code content is kept as-is (universal). Italian text
 * for each lesson body can be refined later via the admin panel.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Italian translations for module and lesson titles
// Key: original English title (lowercased) → Italian title
const MODULE_TRANSLATIONS: Record<string, string> = {
  "introduction to databases": "Introduzione ai Database",
  "sql fundamentals": "Fondamenti di SQL",
  "advanced queries": "Query Avanzate",
  "database design": "Progettazione del Database",
  "transactions and concurrency": "Transazioni e Concorrenza",
  "indexes and performance": "Indici e Prestazioni",
  "security and access control": "Sicurezza e Controllo degli Accessi",
  "backup and recovery": "Backup e Ripristino",
};

const LESSON_TRANSLATIONS: Record<string, string> = {
  "what is a database?": "Cos'è un Database?",
  "relational model": "Modello Relazionale",
  "first steps with sql": "Primi Passi con SQL",
  "select statement": "Istruzione SELECT",
  "filtering data": "Filtrare i Dati",
  "sorting and limiting": "Ordinamento e Limitazione",
  "joins": "JOIN tra Tabelle",
  "aggregation functions": "Funzioni di Aggregazione",
  "subqueries": "Sottoquery",
  "views": "Viste",
  "stored procedures": "Stored Procedure",
  "triggers": "Trigger",
  "entity-relationship model": "Modello Entità-Relazione",
  "normalization": "Normalizzazione",
  "foreign keys": "Chiavi Esterne",
  "acid properties": "Proprietà ACID",
  "transactions": "Transazioni",
  "isolation levels": "Livelli di Isolamento",
  "index types": "Tipi di Indice",
  "query optimization": "Ottimizzazione delle Query",
  "execution plans": "Piani di Esecuzione",
  "users and roles": "Utenti e Ruoli",
  "permissions": "Permessi",
  "backup strategies": "Strategie di Backup",
  "point-in-time recovery": "Ripristino in un Momento Preciso",
};

function translateTitle(title: string): string {
  const lower = title.toLowerCase();
  return (
    MODULE_TRANSLATIONS[lower] ??
    LESSON_TRANSLATIONS[lower] ??
    title // fallback: keep original
  );
}

async function main() {
  const SOURCE_SLUG = "database-sql-2025";
  const TARGET_SLUG = "database-sql-2025-it";

  console.log(`Looking up source course: ${SOURCE_SLUG}`);

  const source = await prisma.interactiveCourse.findUnique({
    where: { slug: SOURCE_SLUG },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!source) {
    console.error(`Source course '${SOURCE_SLUG}' not found. Aborting.`);
    process.exit(1);
  }

  // Check if target already exists
  const existing = await prisma.interactiveCourse.findUnique({
    where: { slug: TARGET_SLUG },
  });

  if (existing) {
    console.log(
      `Target course '${TARGET_SLUG}' already exists (id: ${existing.id}). Skipping creation.`
    );
    process.exit(0);
  }

  console.log(
    `Creating Italian course '${TARGET_SLUG}' from '${SOURCE_SLUG}'...`
  );

  const italianCourse = await prisma.interactiveCourse.create({
    data: {
      title: `${source.title} (Italiano)`,
      slug: TARGET_SLUG,
      description: `Versione italiana del corso: ${source.description}`,
      category: source.category,
      difficulty: source.difficulty,
      imageUrl: source.imageUrl,
      published: false, // starts unpublished; enable via admin when ready
      order: source.order + 1,
    },
  });

  console.log(`Created course: ${italianCourse.id}`);

  for (const mod of source.modules) {
    const italianModule = await prisma.interactiveModule.create({
      data: {
        title: translateTitle(mod.title),
        order: mod.order,
        courseId: italianCourse.id,
      },
    });

    console.log(
      `  Module: "${mod.title}" → "${italianModule.title}" (${italianModule.id})`
    );

    for (const lesson of mod.lessons) {
      const italianSlug = `${lesson.slug}-it`;

      // Check for slug collision
      const slugExists = await prisma.interactiveLesson.findUnique({
        where: { slug: italianSlug },
      });

      const finalSlug = slugExists ? `${italianSlug}-${Date.now()}` : italianSlug;

      const italianLesson = await prisma.interactiveLesson.create({
        data: {
          title: translateTitle(lesson.title),
          slug: finalSlug,
          type: lesson.type,
          content: lesson.content, // SQL/code content is universal
          order: lesson.order,
          moduleId: italianModule.id,
        },
      });

      console.log(
        `    Lesson: "${lesson.title}" → "${italianLesson.title}" (${italianLesson.id})`
      );
    }
  }

  console.log(
    `\nDone! Italian course created with slug '${TARGET_SLUG}'.`
  );
  console.log(
    "It is set to unpublished. Enable it via the admin panel when the content is ready."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
