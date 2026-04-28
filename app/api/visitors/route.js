import { getVisitors } from "@/lib/visitors";

export const dynamic = "force-dynamic";

export async function GET() {
  const visitors = await getVisitors();
  return Response.json({ visitors });
}
