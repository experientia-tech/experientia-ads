import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

// Managed Postgres (AWS RDS, Supabase, etc.) requires TLS but serves a CA that
// isn't in Node's default trust store, so the pg driver would reject it. Enable
// TLS without strict chain verification for remote hosts; skip it for local DBs.
const useSsl = !/localhost|127\.0\.0\.1|sslmode=disable/.test(connectionString);

const adapter = new PrismaPg({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
})

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
