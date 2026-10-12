import { getActiveVideo } from "@/lib/videos";
import { endpoint } from "@/lib/http";
export const GET = endpoint(async (request) => {
  const params = new URL(request.url).searchParams;
  return Response.json({ activeVideo: await getActiveVideo(params.get("audience"), params.get("language")) });
});
