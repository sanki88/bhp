import path from "node:path";
import { languageCodes } from "@/lib/languages";
import { protectedEndpoint } from "@/lib/auth";
import { readJson } from "@/lib/http";
import {
  addVideo,
  deleteVideo,
  getActiveVideo,
  getVideoStore,
  setActiveVideo,
} from "@/lib/videos";
import { normalizeLanguage } from "@/lib/languages";

export const dynamic = "force-dynamic";

export const GET = protectedEndpoint(["admin"], async (request) => {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience");
  const language = normalizeLanguage(searchParams.get("language"));
  const store = await getVideoStore();
  const activeVideo = audience ? await getActiveVideo(audience, language) : null;

  return Response.json({ ...store, activeVideo });
});

export const POST = protectedEndpoint(["admin"], async (request) => {
  const limit = 200 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > limit + 65536) return Response.json({ error: "Maksymalny rozmiar filmu to 200 MB." }, { status: 413 });
  const formData = await request.formData();
  const file = formData.get("video");
  const audience = formData.get("audience");
  const language = formData.get("language");
  const title = formData.get("title");

  if (!file || typeof file === "string") {
    return Response.json({ error: "Wybierz plik wideo." }, { status: 400 });
  }

  if (!["video/mp4", "video/webm", "video/ogg"].includes(file.type) || ![".mp4", ".webm", ".ogg"].includes(path.extname(file.name).toLowerCase()) || file.size === 0 || file.size > limit || !languageCodes.includes(language) || !["guest", "subcontractor"].includes(audience)) {
    return Response.json({ error: "Plik musi byc filmem." }, { status: 400 });
  }

  const video = await addVideo({ audience, language, title, file });

  return Response.json({
    ok: true,
    video,
  });
});

export const PUT = protectedEndpoint(["admin"], async (request) => {
  const payload = await readJson(request);
  if (typeof payload.id !== "string" || payload.id.length > 100) return Response.json({ error: "Nieprawidłowe ID." }, { status: 400 });
  const video = await setActiveVideo(payload.id);

  if (!video) {
    return Response.json({ error: "Nie znaleziono filmu." }, { status: 404 });
  }

  return Response.json({ video });
});

export const DELETE = protectedEndpoint(["admin"], async (request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Brakuje ID filmu." }, { status: 400 });
  }

  const deleted = await deleteVideo(id);

  if (!deleted) {
    return Response.json(
      { error: "Nie mozna usunac tego filmu." },
      { status: 400 },
    );
  }

  return Response.json({ ok: true });
});
