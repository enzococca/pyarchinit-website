import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "$disconnect" || prop === "$connect") {
          return () => Promise.resolve();
        }
        return new Proxy({} as any, {
          get() {
            return () => Promise.resolve(null);
          },
        });
      },
    });
  }

  // Use PrismaPg adapter with connection string directly (no pg.Pool)
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
