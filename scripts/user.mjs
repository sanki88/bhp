import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { randomUUID } from "node:crypto";
import { getSql, closeDatabase } from "../app/lib/database.mjs";
import { hashPassword } from "../app/lib/passwords.mjs";

const [action, input, role] = process.argv.slice(2);
const username = input?.trim().toLowerCase();
if (!["create", "password", "disable", "list"].includes(action) || (action !== "list" && !/^[a-z0-9._-]{3,80}$/.test(username || "")) || (action === "create" && !["admin", "guard"].includes(role))) {
  console.error("Usage: node scripts/user.mjs create LOGIN admin|guard | password LOGIN | disable LOGIN | list");
  process.exit(1);
}
async function passwordPrompt() {
  if (!process.stdin.isTTY) throw new Error("Use an interactive terminal (-it). Passwords are never accepted as command-line arguments.");
  let muted = false;
  const output = new Writable({ write(chunk, encoding, callback) { if (!muted) process.stdout.write(chunk, encoding); callback(); } });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  try {
    process.stdout.write("Hasło (12–128 znaków): "); muted = true;
    const password = await rl.question("");
    process.stdout.write("\nPowtórz hasło: ");
    const confirmation = await rl.question("");
    process.stdout.write("\n");
    if (password !== confirmation) throw new Error("Hasła są różne.");
    return hashPassword(password);
  } finally { muted = false; rl.close(); }
}
try {
  const sql = getSql();
  if (action === "list") console.table(await sql`SELECT username, role, active FROM users ORDER BY username`);
  else if (action === "create") {
    const hash = await passwordPrompt();
    await sql`INSERT INTO users (id, username, password_hash, role) VALUES (${randomUUID()}, ${username}, ${hash}, ${role})`;
    console.log("Konto utworzone.");
  } else {
    const hash = action === "password" ? await passwordPrompt() : null;
    await sql.begin(async (tx) => {
      const [user] = await tx`SELECT id FROM users WHERE username = ${username} FOR UPDATE`;
      if (!user) throw new Error("Konto nie istnieje.");
      if (action === "disable") await tx`UPDATE users SET active = FALSE WHERE id = ${user.id}`;
      else await tx`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
      await tx`DELETE FROM sessions WHERE user_id = ${user.id}`;
    });
    console.log("Konto zaktualizowane; dotychczasowe sesje unieważnione.");
  }
} catch (error) { console.error(error.code === "23505" ? "Konto już istnieje." : error.message); process.exitCode = 1; }
finally { await closeDatabase(); }
