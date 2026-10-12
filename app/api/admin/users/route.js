import { protectedEndpoint, rateLimit } from "@/lib/auth";
import { readJson } from "@/lib/http";
import { createManagedUser, getManagedUsers, updateManagedUser } from "@/lib/users";

export const dynamic = "force-dynamic";

export const GET = protectedEndpoint(["admin"], async (_request, actor) => {
  return Response.json({ users: await getManagedUsers(), currentUserId: actor.id });
});

export const POST = protectedEndpoint(["admin"], async (request, actor) => {
  const payload = await readJson(request);
  await rateLimit(`manage-users:${actor.id}`, 60, 900);
  const user = await createManagedUser(actor.id, payload);
  return Response.json({ user }, { status: 201 });
});

export const PATCH = protectedEndpoint(["admin"], async (request, actor) => {
  const payload = await readJson(request);
  await rateLimit(`manage-users:${actor.id}`, 60, 900);
  const user = await updateManagedUser(actor.id, payload);
  return Response.json({ user, signOut: user.id === actor.id });
});
