import { protectedEndpoint } from "@/lib/auth";
import { readJson } from "@/lib/http";
import { getVisitors, updateVisitorBlacklist } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export const GET = protectedEndpoint(["admin", "guard"], async () => {
  const visitors = await getVisitors();
  return Response.json({ visitors });
});

export const PATCH = protectedEndpoint(["admin"], async (request) => {
  const payload = await readJson(request);

  if (typeof payload.id !== "string" || payload.id.length > 100 || typeof payload.blacklisted !== "boolean" || (payload.blacklisted && (typeof payload.blacklistReason !== "string" || !payload.blacklistReason.trim())) || (payload.blacklistReason !== undefined && typeof payload.blacklistReason !== "string")) {
    return Response.json({ error: "Brakuje ID wpisu." }, { status: 400 });
  }

  const visitor = await updateVisitorBlacklist(
    payload.id,
    payload.blacklisted,
    payload.blacklistReason,
  );

  if (!visitor) {
    return Response.json({ error: "Nie znaleziono wpisu." }, { status: 404 });
  }

  return Response.json({ visitor });
});
