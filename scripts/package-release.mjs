import { mkdir, cp, copyFile, writeFile, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { exportData } from "./export-data.mjs";
import { closeDatabase } from "../app/lib/database.mjs";

const stamp = new Date().toISOString().replace(/[-:.]/g, "");
const directory = path.resolve("releases", `bhp-${stamp}`);
await mkdir(directory, { recursive: true, mode: 0o700 });
for (const item of ["app", "public", "db", "docker", "scripts", "tests", "docs", "package.json", "package-lock.json", "next.config.mjs", "jsconfig.json", "eslint.config.mjs", "Dockerfile", ".dockerignore", ".env.example", "compose.yml", "compose.public.yml", "README.md", ".gitattributes"]) {
  await cp(item, path.join(directory, item), { recursive: true, filter: (source) => !/\.(mp4|webm|ogg)$/i.test(source) && path.basename(source) !== "videos" });
}
await mkdir(path.join(directory, "legacy/data"), { recursive: true });
if (process.env.DATABASE_URL || process.env.DB_PASSWORD_FILE) {
  try { await exportData(path.join(directory, "legacy")); } finally { await closeDatabase(); }
} else {
  if (!process.argv.includes("--legacy")) throw new Error("Configure a database for the current snapshot, or explicitly use --legacy for the original JSON data.");
for (const name of ["visitors.json", "questions.json", "videos.json"]) {
  try { await copyFile(path.join("data", name), path.join(directory, "legacy/data", name)); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
await mkdir(path.join(directory, "legacy/public"), { recursive: true });
for (const item of ["public/videos", "public/szkolenie-bhp.mp4"]) {
  try { await cp(item, path.join(directory, "legacy", item), { recursive: true }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
}
const archive = `${directory}.tar.gz`;
const result = spawnSync("tar", ["-czf", archive, "-C", directory, "."], { stdio: "inherit", windowsHide: true });
if (result.status !== 0) throw new Error("Archive creation failed.");
const digest = createHash("sha256").update(await readFile(archive)).digest("hex");
await writeFile(`${archive}.sha256`, `${digest}  ${path.basename(archive)}\n`);
console.log(`Release: ${archive}\nSize: ${(await stat(archive)).size} bytes\nSHA256: ${digest}\nContains personal data and account hashes for import. No plaintext passwords, .env, node_modules or test data.`);
