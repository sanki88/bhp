import { mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { getSql } from "../app/lib/database.mjs";

export async function exportData(directory) {
  await mkdir(path.join(directory, "data"), { recursive: true });
  await mkdir(path.join(directory, "public/videos"), { recursive: true });
  const snapshot = await getSql().begin("isolation level repeatable read read only", async (sql) => {
    const visitors = await sql`SELECT id, completed_at AS "completedAt", expires_at AS "expiresAt", first_name AS "firstName", last_name AS "lastName", phone, company, visit_purpose AS "visitPurpose", visitor_type AS "visitorType", training_language AS "trainingLanguage", quiz_score AS "quizScore", blacklisted, blacklist_reason AS "blacklistReason", blacklisted_at AS "blacklistedAt" FROM visitors`;
    const questions = { pl: [], en: [], de: [], tr: [] };
    for (const { language, ...q } of await sql`SELECT id, language, text, options, correct_option_id AS "correctOptionId" FROM questions ORDER BY created_at DESC, id`) questions[language].push(q);
    const videos = await sql`SELECT id, title, audience, language, file_name AS "fileName", created_at AS "createdAt", active FROM videos`;
    const users = await sql`SELECT id, username, password_hash AS "passwordHash", role, active FROM users`;
    return { visitors, questions, users, videos: { videos: videos.map((v) => ({ ...v, url: `/videos/${v.fileName}` })), active: Object.fromEntries(videos.filter((v) => v.active).map((v) => [`${v.language}:${v.audience}`, v.id])) } };
  });
  for (const [name, value] of Object.entries(snapshot)) await writeFile(path.join(directory, "data", `${name}.json`), JSON.stringify(value, null, 2));
  for (const video of snapshot.videos.videos) {
    if (!/^[a-zA-Z0-9_-]+\.(mp4|webm|ogg)$/.test(video.fileName)) throw new Error("Invalid video filename in database.");
    await copyFile(path.join(process.env.MEDIA_DIR || "data/media", video.fileName), path.join(directory, "public/videos", video.fileName));
  }
  console.log(`Database snapshot: ${snapshot.visitors.length} visitors, ${snapshot.users.length} staff accounts, ${snapshot.videos.videos.length} videos. Account passwords remain hashed.`);
}
