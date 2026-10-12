import postgres from "postgres";
import { readFileSync } from "node:fs";

export function getSql() {
  if (!globalThis.bhpSql) {
    const password = process.env.DB_PASSWORD_FILE
      ? readFileSync(process.env.DB_PASSWORD_FILE, "utf8").trim()
      : process.env.DB_PASSWORD;
    if (!process.env.DATABASE_URL && !password) {
      throw new Error("Configure DATABASE_URL or DB_PASSWORD_FILE. File storage is disabled.");
    }
    const options = {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: process.env.DB_SSL === "require" ? "require" : false,
      onnotice: () => {},
    };
    globalThis.bhpSql = process.env.DATABASE_URL
      ? postgres(process.env.DATABASE_URL, options)
      : postgres({ ...options, host: process.env.DB_HOST || "db", port: Number(process.env.DB_PORT || 5432), database: process.env.DB_NAME || "bhp", username: process.env.DB_USER || "bhp", password });
  }
  return globalThis.bhpSql;
}

export async function closeDatabase() {
  if (globalThis.bhpSql) await globalThis.bhpSql.end();
  delete globalThis.bhpSql;
}
