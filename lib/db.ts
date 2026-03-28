import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // During build time (Vercel or Docker), return a dummy proxy
  // VERCEL_ENV is not set during build, but NEXT_PHASE is
  const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";

  if (!connectionString || isBuildTime) {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === "$disconnect" || prop === "$connect") {
          return () => Promise.resolve();
        }
        // Return a proxy for any model access that returns empty results
        return new Proxy({} as any, {
          get() {
            return () => Promise.resolve(null);
          },
        });
      },
    });
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
