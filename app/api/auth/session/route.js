import { getSession } from "@/lib/auth";
import { endpoint } from "@/lib/http";
export const GET = endpoint(async () => Response.json({ user: await getSession() }));
