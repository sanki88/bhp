import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSql } from "./database.mjs";
import { getVideoKey, normalizeAudience, normalizeLanguage } from "./languages";
export const mediaDirectory = () => path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_DIR || "data/media");
const columns = 'id, title, audience, language, file_name AS "fileName", created_at AS "createdAt", active';
const prepare = (video) => ({ ...video, url: `/api/media/${encodeURIComponent(video.fileName)}` });
export async function getVideoStore() {
  const sql = getSql();
  const videos = (await sql`SELECT ${sql.unsafe(columns)} FROM videos ORDER BY created_at DESC, id`).map(prepare);
  return { videos, active: Object.fromEntries(videos.filter((v) => v.active).map((v) => [getVideoKey(v.language, v.audience), v.id])) };
}
export async function getActiveVideo(audience, language) {
  const sql = getSql();
  const [video] = await sql`SELECT ${sql.unsafe(columns)} FROM videos WHERE active AND audience = ${normalizeAudience(audience)} AND language = ${normalizeLanguage(language)}`;
  if (!video) return null;
  try { await fs.access(path.join(/* turbopackIgnore: true */ mediaDirectory(), video.fileName)); } catch { return null; }
  return prepare(video);
}
export async function addVideo({ audience, language, title, file }) {
  const id = randomUUID();
  const fileName = `${id}${path.extname(file.name).toLowerCase()}`;
  const target = path.join(/* turbopackIgnore: true */ mediaDirectory(), fileName);
  await fs.mkdir(mediaDirectory(), { recursive: true });
  await fs.writeFile(target, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
  try {
    return await getSql().begin(async (sql) => {
      await sql`SELECT pg_advisory_xact_lock(72481603)`;
      await sql`UPDATE videos SET active = FALSE WHERE audience = ${audience} AND language = ${language}`;
      const [video] = await sql`INSERT INTO videos (id, title, audience, language, file_name, active) VALUES (${id}, ${String(title || "Film BHP").trim().slice(0, 120)}, ${audience}, ${language}, ${fileName}, TRUE) RETURNING ${sql.unsafe(columns)}`;
      return prepare(video);
    });
  } catch (error) { await fs.unlink(target); throw error; }
}
export async function setActiveVideo(id) {
  return getSql().begin(async (sql) => {
    await sql`SELECT pg_advisory_xact_lock(72481603)`;
    const [video] = await sql`SELECT ${sql.unsafe(columns)} FROM videos WHERE id = ${id}`;
    if (!video) return null;
    await sql`UPDATE videos SET active = FALSE WHERE audience = ${video.audience} AND language = ${video.language}`;
    await sql`UPDATE videos SET active = TRUE WHERE id = ${id}`;
    return prepare(video);
  });
}
export async function deleteVideo(id) {
  const deleted = await getSql().begin(async (sql) => {
    await sql`SELECT pg_advisory_xact_lock(72481603)`;
    const [video] = await sql`DELETE FROM videos WHERE id = ${id} RETURNING file_name`;
    return video;
  });
  // Retain unreferenced files for in-flight streams and consistent offline backups.
  return Boolean(deleted);
}
