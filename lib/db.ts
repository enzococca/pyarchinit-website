import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During build time, return a dummy client that will fail at runtime
    // This prevents build crashes when DB is not available
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "$disconnect" || prop === "$connect") {
          return () => Promise.resolve();
        }
        throw new Error(`Database not configured. Set DATABASE_URL environment variable.`);
      },
    });
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
