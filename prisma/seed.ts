import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  console.log("Seed completed: admin user + default settings");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
