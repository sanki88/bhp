import { randomUUID } from "node:crypto";
import { getSql } from "./database.mjs";

const columns = 'id, completed_at AS "completedAt", expires_at AS "expiresAt", first_name AS "firstName", last_name AS "lastName", phone, company, visit_purpose AS "visitPurpose", visitor_type AS "visitorType", training_language AS "trainingLanguage", quiz_score AS "quizScore", blacklisted, blacklist_reason AS "blacklistReason", blacklisted_at AS "blacklistedAt"';
export async function getVisitors() {
  const sql = getSql();
  return sql`SELECT ${sql.unsafe(columns)} FROM visitors ORDER BY completed_at DESC`;
}
export async function addVisitor(visitor, transaction) {
  if (!transaction) return getSql().begin((tx) => addVisitor(visitor, tx));
  const sql = transaction;
  await sql`SELECT pg_advisory_xact_lock(72481602)`;
  const completedAt = new Date();
  const expiresAt = new Date(completedAt);
  const day = expiresAt.getUTCDate();
  expiresAt.setUTCDate(1);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(expiresAt.getUTCFullYear(), expiresAt.getUTCMonth() + 1, 0)).getUTCDate();
  expiresAt.setUTCDate(Math.min(day, lastDay));
  const [match] = await sql`SELECT blacklist_reason, blacklisted_at FROM visitors WHERE blacklisted AND (phone = ${visitor.phone} OR (lower(first_name) = ${visitor.firstName.toLowerCase()} AND lower(last_name) = ${visitor.lastName.toLowerCase()})) LIMIT 1`;
  const [stored] = await sql`
    INSERT INTO visitors (id, completed_at, expires_at, first_name, last_name, phone, company, visit_purpose, visitor_type, training_language, quiz_score, blacklisted, blacklist_reason, blacklisted_at)
    VALUES (${randomUUID()}, ${completedAt}, ${expiresAt}, ${visitor.firstName}, ${visitor.lastName}, ${visitor.phone}, ${visitor.company}, ${visitor.visitPurpose}, ${visitor.visitorType}, ${visitor.trainingLanguage}, ${visitor.quizScore}, ${Boolean(match)}, ${match?.blacklist_reason || ""}, ${match?.blacklisted_at || null})
    RETURNING ${sql.unsafe(columns)}`;
  return stored;
}
export async function updateVisitorBlacklist(id, blacklisted, reason = "") {
  return getSql().begin(async (sql) => {
    await sql`SELECT pg_advisory_xact_lock(72481602)`;
    const [target] = await sql`SELECT first_name, last_name, phone FROM visitors WHERE id = ${id}`;
    if (!target) return null;
    await sql`UPDATE visitors SET blacklisted = ${blacklisted}, blacklist_reason = ${blacklisted ? reason.trim().slice(0, 300) : ""}, blacklisted_at = ${blacklisted ? new Date() : null}
      WHERE phone = ${target.phone} OR (lower(first_name) = ${target.first_name.toLowerCase()} AND lower(last_name) = ${target.last_name.toLowerCase()})`;
    const [updated] = await sql`SELECT ${sql.unsafe(columns)} FROM visitors WHERE id = ${id}`;
    return updated;
  });
}
