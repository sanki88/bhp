import { getSql } from "@/lib/database.mjs";
import { createSession, rateLimit } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords.mjs";
import { assertSameOrigin, endpoint, HttpError, readJson } from "@/lib/http";

// Equal-cost check for unknown usernames; this hash is never an account credential.
const dummyHash = `scrypt$${"0".repeat(32)}$${"0".repeat(128)}`;
export const POST = endpoint(async (request) => {
  assertSameOrigin(request);
  const { username, password, panel } = await readJson(request);
  if (typeof username !== "string" || username.length > 80 || typeof password !== "string" || password.length > 128) throw new HttpError(400, "Nieprawidłowe dane logowania.");
  const normalized = username.trim().toLowerCase();
  // Proxy overwrites X-Real-IP; it is only trusted when explicitly enabled.
  const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-real-ip") || "unknown" : "local";
  await rateLimit(`login-ip:${ip}`, 40, 900);
  await rateLimit(`login-user:${normalized}`, 10, 900);
  const sql = getSql();
  const [user] = await sql`SELECT id, role, password_hash, active FROM users WHERE username = ${normalized}`;
  const valid = await verifyPassword(password, user?.password_hash || dummyHash);
  if (!valid || !user?.active || (panel === "admin" && user.role !== "admin")) throw new HttpError(401, "Nieprawidłowy login lub hasło.");
  await createSession(user.id);
  return Response.json({ user: { username: normalized, role: user.role } });
});
