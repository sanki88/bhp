import { readFile, mkdir, copyFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSql, closeDatabase } from "../app/lib/database.mjs";
import { questions as defaults } from "../app/lib/questions.js";

async function readJson(file, fallback) {
  try { return JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, "")); }
  catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

export async function importData(directory = "data", mediaSource = "public") {
  const sql = getSql();
  const summary = { visitors: 0, users: 0, questions: 0, videos: 0, missingVideos: 0 };
  await sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(72481601)`;
    const [done] = await tx`SELECT name FROM data_imports WHERE name = 'legacy-v1'`;
    if (done) { console.log("Initial data import already completed; no records changed."); return; }
    // Updates no longer need access to the original migration files.
    const visitors = await readJson(path.join(directory, "visitors.json"), []);
    const users = await readJson(path.join(directory, "users.json"), []);
    const rawQuestions = await readJson(path.join(directory, "questions.json"), { pl: defaults });
    const questions = Array.isArray(rawQuestions) ? { pl: rawQuestions } : rawQuestions;
    const store = await readJson(path.join(directory, "videos.json"), { videos: [], active: {} });
    const destination = path.resolve(process.env.MEDIA_DIR || "data/media");
    for (const user of users) {
      if (!/^[a-z0-9._-]{3,80}$/.test(user.username) || !["admin", "guard"].includes(user.role) || !/^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(user.passwordHash)) throw new Error("Invalid staff account in import.");
      const result = await tx`INSERT INTO users (id, username, password_hash, role, active) VALUES (${user.id}, ${user.username}, ${user.passwordHash}, ${user.role}, ${user.active !== false}) ON CONFLICT (username) DO NOTHING RETURNING id`;
      summary.users += result.length;
    }
    for (const v of visitors) {
      if (!v.id || !v.firstName || !v.lastName || !v.phone || !v.completedAt) throw new Error("Invalid legacy visitor. Import rolled back.");
      const expires = v.expiresAt || new Date(new Date(v.completedAt).setMonth(new Date(v.completedAt).getMonth() + 6)).toISOString();
      const result = await tx`INSERT INTO visitors (id, completed_at, expires_at, first_name, last_name, phone, company, visit_purpose, visitor_type, training_language, quiz_score, blacklisted, blacklist_reason, blacklisted_at)
        VALUES (${v.id}, ${v.completedAt}, ${expires}, ${v.firstName}, ${v.lastName}, ${v.phone}, ${v.company || ""}, ${v.visitPurpose || ""}, ${v.visitorType || "guest"}, ${v.trainingLanguage || "pl"}, ${v.quizScore || 5}, ${Boolean(v.blacklisted)}, ${v.blacklistReason || ""}, ${v.blacklistedAt || null}) ON CONFLICT (id) DO NOTHING RETURNING id`;
      summary.visitors += result.length;
    }
    for (const language of ["pl", "en", "de", "tr"]) {
      for (const q of questions[language] || []) {
        if (!q.id || !q.text || !Array.isArray(q.options) || q.options.length !== 4 || !["a", "b", "c", "d"].includes(q.correctOptionId)) throw new Error("Invalid legacy question. Import rolled back.");
        const result = await tx`INSERT INTO questions (id, language, text, options, correct_option_id) VALUES (${String(q.id)}, ${language}, ${q.text}, ${tx.json(q.options)}, ${q.correctOptionId}) ON CONFLICT (language, id) DO NOTHING RETURNING id`;
        summary.questions += result.length;
      }
    }
    await mkdir(destination, { recursive: true });
    for (const v of store.videos || []) {
      const fileName = v.fileName;
      if (!/^[a-zA-Z0-9_-]+\.(mp4|webm|ogg)$/.test(fileName)) throw new Error("Unsafe legacy video filename. Import stopped.");
      const source = path.join(mediaSource, v.url?.startsWith("/videos/") ? "videos" : "", fileName);
      try { await access(source); } catch (error) {
        if (error.code !== "ENOENT") throw error;
        summary.missingVideos++; continue;
      }
      if (path.resolve(source) !== path.join(destination, fileName)) {
        try { await copyFile(source, path.join(destination, fileName), 1); }
        catch (error) { if (error.code !== "EEXIST") throw error; }
      }
      const language = v.language || "pl";
      const audience = v.audience === "subcontractor" ? "subcontractor" : "guest";
      const active = (store.active?.[`${language}:${audience}`] || store.active?.[audience]) === v.id;
      const result = await tx`INSERT INTO videos (id, title, audience, language, file_name, created_at, active) VALUES (${v.id}, ${v.title || "Film BHP"}, ${audience}, ${language}, ${fileName}, ${v.createdAt || new Date()}, ${active}) ON CONFLICT (id) DO NOTHING RETURNING id`;
      summary.videos += result.length;
    }
    await tx`INSERT INTO data_imports (name) VALUES ('legacy-v1')`;
  });
  console.log("Import counts:", summary);
  return summary;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await importData(process.argv[2], process.argv[3]); } finally { await closeDatabase(); }
}
