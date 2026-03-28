import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@pyarchinit.org" },
    update: {},
    create: {
      email: "admin@pyarchinit.org",
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const defaults = [
    { key: "site_name", value: JSON.stringify("pyArchInit") },
    { key: "site_description", value: JSON.stringify("Piattaforma Open Source per l'Archeologia") },
    { key: "social_github", value: JSON.stringify("https://github.com/pyarchinit") },
  ];

  for (const setting of defaults) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  // Forum categories
  const categories = [
    { name: "Generale", slug: "generale", description: "Discussioni generali su pyArchInit", order: 0, color: "#00D4AA" },
    { name: "Supporto Tecnico", slug: "supporto", description: "Problemi tecnici e richieste di aiuto", order: 1, color: "#D4712A" },
    { name: "Sviluppo", slug: "sviluppo", description: "Discussioni sullo sviluppo del plugin", order: 2, color: "#8B7355" },
    { name: "Showcase", slug: "showcase", description: "Condividi i tuoi progetti e risultati", order: 3, color: "#22C55E" },
    { name: "Proposte", slug: "proposte", description: "Proponi nuove funzionalità e miglioramenti", order: 4, color: "#3B82F6" },
  ];

  for (const cat of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log("Seed completed: admin user + default settings + forum categories");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
