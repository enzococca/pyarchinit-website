/**
 * Seed existing hardcoded videos into the database.
 * Run with: npx ts-node --project tsconfig.json -e "require('./scripts/seed-videos.ts')"
 * Or: npx tsx scripts/seed-videos.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

const videos = [
  { youtubeId: "UjJOEty0vSI", title: "Nuovo sistema simboli per USM", category: "Funzionalità", order: 0 },
  { youtubeId: "UwvDLGMD80s", title: "Gestione alzati - pyArchInit Goes2Blend 3D", category: "3D", order: 1 },
  { youtubeId: "sKZwFFI6TxQ", title: "Spostare punti da coordinate relative ad assolute", category: "GIS", order: 2 },
  { youtubeId: "06CZCq4cREI", title: "Drone Unit for pyArchInit", category: "Droni", order: 3 },
  { youtubeId: "tQfZ2kxicY0", title: "Tafonomia", category: "Schede", order: 4 },
  { youtubeId: "e3jCS17g43s", title: "Strutture e ipotesi", category: "Schede", order: 5 },
  { youtubeId: "w-VOrRgGcfw", title: "Campioni", category: "Schede", order: 6 },
  { youtubeId: "v4G03oX9SCM", title: "Reperti", category: "Schede", order: 7 },
  { youtubeId: "_n_O6TCdObY", title: "Layer US e quote", category: "Layer GIS", order: 8 },
  { youtubeId: "sfW7xOsmLFc", title: "Layer sezioni", category: "Layer GIS", order: 9 },
  { youtubeId: "naCytTz0sSk", title: "Layer sondaggi", category: "Layer GIS", order: 10 },
  { youtubeId: "388hhkz55EY", title: "Layer individui", category: "Layer GIS", order: 11 },
  { youtubeId: "AQFYxNg4Agc", title: "Layer siti (puntuali e poligonali)", category: "Layer GIS", order: 12 },
  { youtubeId: "SU1hJatrf0E", title: "Layer punti di riferimento", category: "Layer GIS", order: 13 },
  { youtubeId: "BbnLfQDfkxg", title: "Layer linee di riferimento", category: "Layer GIS", order: 14 },
];

async function main() {
  console.log(`Seeding ${videos.length} videos...`);

  for (const video of videos) {
    const existing = await db.video.findFirst({
      where: { youtubeId: video.youtubeId },
    });

    if (existing) {
      console.log(`  SKIP (already exists): ${video.title}`);
      continue;
    }

    await db.video.create({
      data: {
        title: video.title,
        youtubeId: video.youtubeId,
        category: video.category,
        order: video.order,
        published: true,
      },
    });
    console.log(`  CREATED: ${video.title}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
