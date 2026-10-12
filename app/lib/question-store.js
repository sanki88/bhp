import { randomUUID } from "node:crypto";
import { getSql } from "./database.mjs";
import { normalizeLanguage } from "./languages";
const columns = 'id, text, options, correct_option_id AS "correctOptionId"';
export async function getQuestions(language) {
  const sql = getSql();
  return sql`SELECT ${sql.unsafe(columns)} FROM questions WHERE language = ${normalizeLanguage(language)} ORDER BY created_at DESC, id`;
}
export async function createQuestion(question, language) {
  const sql = getSql();
  const [stored] = await sql`INSERT INTO questions (id, language, text, options, correct_option_id)
    VALUES (${randomUUID()}, ${normalizeLanguage(language)}, ${question.text.trim()}, ${sql.json(normalizeOptions(question.options))}, ${question.correctOptionId}) RETURNING ${sql.unsafe(columns)}`;
  return stored;
}
export async function updateQuestion(id, question, language) {
  const sql = getSql();
  const [stored] = await sql`UPDATE questions SET text = ${question.text.trim()}, options = ${sql.json(normalizeOptions(question.options))}, correct_option_id = ${question.correctOptionId}
    WHERE id = ${id} AND language = ${normalizeLanguage(language)} RETURNING ${sql.unsafe(columns)}`;
  return stored || null;
}
export async function deleteQuestion(id, language) {
  const sql = getSql();
  const result = await sql`DELETE FROM questions WHERE id = ${id} AND language = ${normalizeLanguage(language)} RETURNING id`;
  return result.length > 0;
}
function normalizeOptions(options) {
  return options.map((option, index) => ({ id: ["a", "b", "c", "d"][index], text: option.text.trim() }));
}
