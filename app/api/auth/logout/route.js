import { cookies } from "next/headers";
import { getSql } from "@/lib/database.mjs";
import { sessionCookie, cookieOptions, tokenHash } from "@/lib/auth";
import { assertSameOrigin, endpoint } from "@/lib/http";

export const POST = endpoint(async (request) => {
  assertSameOrigin(request);
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) await getSql()`DELETE FROM sessions WHERE token_hash = ${tokenHash(token)}`;
  jar.set(sessionCookie, "", { ...cookieOptions(), maxAge: 0 });
  return Response.json({ ok: true });
});
