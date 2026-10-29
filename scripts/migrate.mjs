import postgres from "postgres";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL)
  throw Error("Set DATABASE_URL before migrating.");
const db = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  await db`CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())`;
  for (const name of (await readdir(resolve("migrations")))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort()) {
    const source = await readFile(resolve("migrations", name), "utf8"),
      checksum = createHash("sha256").update(source).digest("hex");
    await db.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(592031992)`;
      const [previous] =
        await tx`SELECT checksum FROM schema_migrations WHERE name=${name}`;
      if (previous) {
        if (previous.checksum !== checksum)
          throw Error(`Applied migration changed: ${name}`);
        return;
      }
      const body = source
        .replace(/^\s*BEGIN;\s*/i, "")
        .replace(/\s*COMMIT;\s*$/i, "");
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations(name,checksum) VALUES (${name},${checksum})`;
      process.stdout.write(`Applied ${name}\n`);
    });
  }
  process.stdout.write("Database migrations are up to date.\n");
} finally {
  await db.end();
}
