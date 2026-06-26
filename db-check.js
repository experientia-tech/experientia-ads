// Standalone DB connection check.
// Usage: node db-check.js
// Mirrors the adapter/SSL setup in lib/prisma.ts so it tests the same path the app uses.

require("dotenv").config();

const { PrismaClient } = require("./app/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL is not set. Add it to your .env file.");
    process.exit(1);
  }

  // Same TLS logic as lib/prisma.ts: enable SSL (without strict chain
  // verification) for remote hosts, skip it for local databases.
  const useSsl = !/localhost|127\.0\.0\.1|sslmode=disable/.test(connectionString);

  const adapter = new PrismaPg({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });

  const prisma = new PrismaClient({ adapter });

  const host = (() => {
    try {
      return new URL(connectionString).host;
    } catch {
      return "(unparseable URL)";
    }
  })();

  console.log(`→ Connecting to ${host} (ssl: ${useSsl ? "on" : "off"})...`);

  const start = Date.now();
  try {
    const rows = await prisma.$queryRaw`SELECT version() AS version, current_database() AS db`;
    const ms = Date.now() - start;
    const { version, db } = rows[0];
    console.log(`✅ Connected in ${ms}ms`);
    console.log(`   database: ${db}`);
    console.log(`   server:   ${String(version).split(",")[0]}`);
    process.exitCode = 0;
  } catch (err) {
    console.error("❌ Connection failed:");
    console.error(`   ${err.message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
