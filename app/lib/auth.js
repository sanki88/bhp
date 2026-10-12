import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { getSql } from "./database.mjs";
import { HttpError, assertSameOrigin, endpoint } from "./http";

export const sessionCookie = "bhp_session";
export const tokenHash = (value) => createHash("sha256").update(value).digest("hex");
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.COOKIE_SECURE !== "false", sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });

export async function getSession() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const sql = getSql();
  const [user] = await sql`SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ${tokenHash(token)} AND s.expires_at > now() AND u.active`;
  return user || null;
}

export async function createSession(userId) {
  const sql = getSql();
  const jar = await cookies();
  const previous = jar.get(sessionCookie)?.value;
  if (previous) await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash(previous)}`;
  await sql`DELETE FROM sessions WHERE expires_at < now()`;
  const token = randomBytes(32).toString("hex");
  await sql`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (${tokenHash(token)}, ${userId}, now() + interval '8 hours')`;
  jar.set(sessionCookie, token, cookieOptions());
}

export function protectedEndpoint(roles, handler) {
  return endpoint(async (request, ...args) => {
    if (!["GET", "HEAD"].includes(request.method)) assertSameOrigin(request);
    const user = await getSession();
    if (!user) throw new HttpError(401, "Zaloguj się ponownie.");
    if (!roles.includes(user.role)) throw new HttpError(403, "Brak uprawnień.");
    return handler(request, user, ...args);
  });
}

export async function rateLimit(key, limit, seconds) {
  const sql = getSql();
  await sql`DELETE FROM rate_limits WHERE expires_at < now()`;
  const [bucket] = await sql`
    INSERT INTO rate_limits (key, count, expires_at) VALUES (${tokenHash(key)}, 1, now() + ${seconds} * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET count = rate_limits.count + 1 RETURNING count`;
  if (bucket.count > limit) throw new HttpError(429, "Za dużo prób. Spróbuj ponownie za kilka minut.");
}
