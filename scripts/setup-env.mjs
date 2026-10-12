import { randomBytes } from "node:crypto";
import { mkdir, writeFile, copyFile, chmod } from "node:fs/promises";
await mkdir("secrets", { recursive: true, mode: 0o700 });
await chmod("secrets", 0o700);
for (const name of ["postgres_password", "db_password"]) {
  try {
    // The parent is owner-only; mounted secret files must also be readable by UID 1001.
    await writeFile(`secrets/${name}`, randomBytes(32).toString("hex") + "\n", { flag: "wx", mode: 0o444 });
  } catch (error) { if (error.code !== "EEXIST") throw error; }
  await chmod(`secrets/${name}`, 0o444);
}
try { await copyFile(".env.example", ".env", 1); await chmod(".env", 0o600); }
catch (error) { if (error.code !== "EEXIST") throw error; }
console.log("Configuration prepared. Existing secrets were preserved. Review APP_ORIGIN in .env.");
