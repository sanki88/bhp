import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { mediaDirectory } from "@/lib/videos";
import { getSql } from "@/lib/database.mjs";
import { endpoint, HttpError } from "@/lib/http";

export const runtime = "nodejs";
export const GET = endpoint(async (request, { params }) => {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9_-]+\.(mp4|webm|ogg)$/.test(filename)) throw new HttpError(404, "Nie znaleziono filmu.");
  const [video] = await getSql()`SELECT id FROM videos WHERE file_name = ${filename} LIMIT 1`;
  if (!video) throw new HttpError(404, "Nie znaleziono filmu.");
  const target = path.join(/* turbopackIgnore: true */ mediaDirectory(), filename);
  let info;
  try { info = await stat(target); } catch { throw new HttpError(404, "Nie znaleziono pliku filmu."); }
  const range = request.headers.get("range");
  let start = 0, end = info.size - 1;
  const headers = { "Accept-Ranges": "bytes", "Content-Type": { ".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg" }[path.extname(filename)], "X-Content-Type-Options": "nosniff" };
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  return new Response(Readable.toWeb(createReadStream(target, { start, end })), { status: range ? 206 : 200, headers });
});
