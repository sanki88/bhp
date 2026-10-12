import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getSql, closeDatabase } from "../app/lib/database.mjs";

export async function migrate() {
  const sql = getSql();
  const directory = fileURLToPath(new URL("../db/migrations/", import.meta.url));
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(72481601)`;
    await tx`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
      const [applied] = await tx`SELECT name FROM schema_migrations WHERE name = ${name}`;
      if (applied) continue;
      await tx.unsafe(await readFile(path.join(directory, name), "utf8"));
      await tx`INSERT INTO schema_migrations (name) VALUES (${name})`;
      console.log(`Migration applied: ${name}`);
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await migrate(); } finally { await closeDatabase(); }
}
