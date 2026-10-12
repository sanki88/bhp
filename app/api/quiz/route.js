import { randomBytes, randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { addVisitor } from "@/lib/visitors";
import { getQuestions } from "@/lib/question-store";
import { getActiveVideo } from "@/lib/videos";
import { normalizeLanguage, normalizeAudience } from "@/lib/languages";
import { getSql } from "@/lib/database.mjs";
import { tokenHash, cookieOptions, rateLimit } from "@/lib/auth";
import { endpoint, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { isValidPhone } from "@/lib/phone.mjs";
import { getUiCopy } from "@/lib/ui-copy";
export const dynamic = "force-dynamic";
export const GET = endpoint(async (request) => {
  const { searchParams } = new URL(request.url);
  const language = normalizeLanguage(searchParams.get("language"));
  const audience = normalizeAudience(searchParams.get("audience"));
  if (!await getActiveVideo(audience, language)) throw new HttpError(503, "Brak aktywnego filmu dla tej wersji szkolenia.");
  const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-real-ip") || "unknown" : "local";
  await rateLimit(`quiz-new:${ip}`, 120, 600);
  const questions = shuffle(await getQuestions(language)).slice(0, 5);
  if (questions.length !== 5) throw new HttpError(409, "Brakuje minimum 5 pytań dla wybranego języka.");
  const token = randomBytes(32).toString("hex");
  const sql = getSql();
  await sql`DELETE FROM quiz_attempts WHERE expires_at < now()`;
  await sql`INSERT INTO quiz_attempts (token_hash, language, audience, questions, expires_at) VALUES (${tokenHash(token)}, ${language}, ${audience}, ${sql.json(questions)}, now() + interval '1 hour')`;
  (await cookies()).set("bhp_quiz", token, { ...cookieOptions(), maxAge: 3600, path: "/api/quiz" });
  return Response.json({ attemptId: tokenHash(token), questions: questions.map(({ id, text, options }) => ({ id, text, options: shuffle(options) })) });
});
export const POST = endpoint(async (request) => {
  assertSameOrigin(request);
  const payload = await readJson(request);
  const token = (await cookies()).get("bhp_quiz")?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token) || payload.attemptId !== tokenHash(token)) throw new HttpError(400, "Rozpocznij quiz ponownie.");
  if (!isValidPhone(payload.visitor?.phone)) throw new HttpError(400, getUiCopy(payload.language).training.form.phoneError);
  const visitor = sanitizeVisitor(payload.visitor);
  if (!visitor || !payload.answers || typeof payload.answers !== "object" || Array.isArray(payload.answers)) throw new HttpError(400, "Niepełne dane gościa lub odpowiedzi.");
  await rateLimit(`quiz-submit:${tokenHash(token)}`, 10, 600);
  return getSql().begin(async (sql) => {
    const [attempt] = await sql`SELECT * FROM quiz_attempts WHERE token_hash = ${tokenHash(token)} AND expires_at > now() FOR UPDATE`;
    if (!attempt || attempt.used_at || attempt.language !== payload.language) throw new HttpError(409, "Quiz wygasł lub został już zaliczony. Rozpocznij ponownie.");
    if (attempt.audience !== visitor.visitorType) throw new HttpError(400, "Nieprawidłowy rodzaj szkolenia.");
    const ids = Object.keys(payload.answers);
    if (ids.length !== 5 || !attempt.questions.every((q) => ids.includes(q.id) && ["a","b","c","d"].includes(payload.answers[q.id]))) throw new HttpError(400, "Odpowiedz na wszystkie wylosowane pytania.");
    const score = attempt.questions.filter((q) => payload.answers[q.id] === q.correctOptionId).length;
    if (score !== 5) return Response.json({ passed: false, score, requiredScore: 5 });
    const stored = await addVisitor({ ...visitor, trainingLanguage: attempt.language, quizScore: score }, sql);
    await sql`UPDATE quiz_attempts SET used_at = now() WHERE token_hash = ${tokenHash(token)}`;
    // Internal blacklist decisions and reasons are visible only to authorized staff.
    return Response.json({ passed: true, score, requiredScore: 5, visitor: { id: stored.id, expiresAt: stored.expiresAt } });
  });
});
function sanitizeVisitor(visitor) {
  if (!visitor || typeof visitor !== "object") return null;
  const result = {};
  for (const field of ["firstName","lastName","phone","company","visitPurpose"]) {
    if (typeof visitor[field] !== "string" || !visitor[field].trim() || visitor[field].length > 160) return null;
    result[field] = visitor[field].trim();
  }
  if (!["guest", "subcontractor"].includes(visitor.visitorType)) return null;
  return { ...result, visitorType: visitor.visitorType };
}
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = randomInt(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
