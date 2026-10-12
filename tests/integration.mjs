import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile, cp, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { getSql, closeDatabase } from "../app/lib/database.mjs";
import { migrate } from "../scripts/migrate.mjs";
import { importData } from "../scripts/import-data.mjs";
import { hashPassword } from "../app/lib/passwords.mjs";
import { exportData } from "../scripts/export-data.mjs";
import { testUserManagement } from "./users-flow.mjs";

const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== "127.0.0.1" || url.pathname !== "/bhp_test") throw new Error("Tests require the isolated localhost database bhp_test.");
const admin = postgres(new URL("postgres", url).href, { onnotice: () => {} });
if (!(await admin`SELECT 1 FROM pg_database WHERE datname = 'bhp_test'`).length) await admin`CREATE DATABASE bhp_test`;
await admin.end();
const sql = getSql();
let server;
let logs = "";
try {
  await migrate(); await migrate();
  await sql`TRUNCATE users, visitors, sessions, rate_limits, quiz_attempts, videos, questions, data_imports CASCADE`;
  const fixture = ".cache/import-fixture";
  await mkdir(fixture, { recursive: true });
  await writeFile(`${fixture}/visitors.json`, JSON.stringify([{ id: "legacy-test", firstName: "Legacy", lastName: "Test", phone: "000000000", company: "Test", visitPurpose: "Test", quizScore: 5, completedAt: "2026-01-01T10:00:00Z", expiresAt: "2026-07-01T10:00:00Z", blacklisted: true, blacklistReason: "Test reason" }]));
  await importData(fixture, ".cache/no-videos");
  await writeFile(`${fixture}/visitors.json`, "legacy source is no longer usable");
  await importData(fixture, ".cache/no-videos");
  assert.equal(Number((await sql`SELECT count(*) FROM visitors`)[0].count), 1);
  assert.ok(Number((await sql`SELECT count(*) FROM questions`)[0].count) >= 5);
  const hash = await hashPassword("Integration-only-password-2026");
  for (const role of ["admin", "guard"]) await sql`INSERT INTO users (id, username, password_hash, role) VALUES (${randomUUID()}, ${`test-${role}`}, ${hash}, ${role})`;
  await cp("public", ".next/standalone/public", { recursive: true });
  await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
  server = spawn(process.execPath, [".next/standalone/server.js"], { env: { ...process.env, NODE_ENV: "production", TRUST_PROXY: "false", PORT: "3100", HOSTNAME: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  server.stdout.on("data", (data) => { logs += data; }); server.stderr.on("data", (data) => { logs += data; });
  const base = "http://localhost:3100";
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) break; } catch {}
    if (i === 59) throw new Error("Server startup failed");
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  async function call(path, { method = "GET", cookie, body, origin = base, headers = {} } = {}) {
    const response = await fetch(base + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method !== "GET" ? { Origin: origin } : {}), ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...headers }, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    const type = response.headers.get("content-type") || "";
    return { status: response.status, cookie: response.headers.get("set-cookie")?.split(";")[0], headers: response.headers, data: type.includes("json") ? await response.json() : await response.text() };
  }
  for (const path of ["/", "/admin", "/ochrona", "/szkolenie?typ=guest&language=pl"]) assert.equal((await call(path)).status, 200, path);
  for (const path of ["/api/visitors", "/api/admin/questions", "/api/admin/video", "/api/admin/visitors/export"]) assert.equal((await call(path)).status, 401, path);
  const login = (role) => call("/api/auth/login", { method: "POST", body: { username: `test-${role}`, password: "Integration-only-password-2026", panel: role } });
  assert.equal((await call("/api/auth/login", { method: "POST", origin: "https://other.invalid", body: { username: "test-admin", password: "x" } })).status, 403);
  assert.equal((await call("/api/auth/login", { method: "POST", body: { username: "test-admin", password: "wrong" } })).status, 401);
  const adminLogin = await login("admin"); assert.equal(adminLogin.status, 200); assert.ok(adminLogin.headers.get("set-cookie").includes("HttpOnly"));
  const adminCookie = adminLogin.cookie;
  const guardCookie = (await login("guard")).cookie;
  await testUserManagement(call, sql, adminCookie, guardCookie);
  assert.equal((await call("/api/visitors", { cookie: guardCookie })).status, 200);
  assert.equal((await call("/api/admin/questions", { cookie: guardCookie })).status, 403);
  assert.equal((await call("/api/visitors", { method: "PATCH", cookie: guardCookie, body: { id: "legacy-test", blacklisted: false } })).status, 403);
  assert.equal((await call("/api/visitors", { method: "PATCH", cookie: adminCookie, origin: "https://other.invalid", body: { id: "legacy-test", blacklisted: false } })).status, 403);
  assert.equal((await call("/api/quiz?language=pl&audience=guest")).status, 503);
  const form = new FormData(); form.set("video", new Blob(["synthetic-video-for-range-test"], { type: "video/mp4" }), "test.mp4"); form.set("audience", "guest"); form.set("language", "pl"); form.set("title", "Integration fixture");
  const uploaded = await call("/api/admin/video", { method: "POST", cookie: adminCookie, body: form }); assert.equal(uploaded.status, 200);
  const video = (await call("/api/video?audience=guest&language=pl")).data.activeVideo; assert.ok(video.url);
  const range = await call(video.url, { headers: { Range: "bytes=0-8" } }); assert.equal(range.status, 206); assert.equal(range.data, "synthetic");
  assert.equal((await call(video.url, { headers: { Range: "bytes=9999-" } })).status, 416);
  const quiz = await call("/api/quiz?language=pl&audience=guest"); assert.equal(quiz.status, 200); assert.equal(quiz.data.questions.length, 5); assert.ok(quiz.data.questions.every((q) => !q.correctOptionId));
  const questions = (await call("/api/admin/questions?language=pl", { cookie: adminCookie })).data.questions;
  const answers = Object.fromEntries(quiz.data.questions.map((q) => [q.id, questions.find((item) => item.id === q.id).correctOptionId]));
  const body = { language: "pl", attemptId: quiz.data.attemptId, answers, visitor: { firstName: "Concurrent", lastName: "Test", phone: "+48 (123) 456-789", company: "Test", visitPurpose: "Test", visitorType: "guest" } };
  for (const phone of ["123abc", "123.456", "123/456", "123\n", "+ () -", "123\t456", 123, null]) {
    const invalidPhone = await call("/api/quiz", { method: "POST", cookie: quiz.cookie, body: { ...body, visitor: { ...body.visitor, phone } } });
    assert.equal(invalidPhone.status, 400, `Invalid phone ${JSON.stringify(phone)}`);
    assert.match(invalidPhone.data.error, /Numer telefonu/);
  }
  assert.equal(Number((await sql`SELECT count(*) FROM visitors WHERE first_name = 'Concurrent'`)[0].count), 0);
  assert.equal((await call("/api/quiz", { method: "POST", body })).status, 400);
  assert.equal((await call("/api/quiz", { method: "POST", cookie: quiz.cookie, body: { ...body, visitor: { ...body.visitor, visitorType: "subcontractor" } } })).status, 400);
  const wrongAnswers = { ...answers, [quiz.data.questions[0].id]: answers[quiz.data.questions[0].id] === "a" ? "b" : "a" };
  assert.equal((await call("/api/quiz", { method: "POST", cookie: quiz.cookie, body: { ...body, answers: wrongAnswers } })).data.passed, false);
  const results = await Promise.all([1, 2].map(() => call("/api/quiz", { method: "POST", cookie: quiz.cookie, body })));
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal(Number((await sql`SELECT count(*) FROM visitors WHERE first_name = 'Concurrent'`)[0].count), 1);
  const saved = results.find((r) => r.status === 200).data.visitor;
  assert.equal((await sql`SELECT phone FROM visitors WHERE id = ${saved.id}`)[0].phone, body.visitor.phone);
  assert.equal(saved.blacklistReason, undefined);
  assert.equal((await call("/api/visitors", { method: "PATCH", cookie: adminCookie, body: { id: saved.id, blacklisted: true, blacklistReason: "Test" } })).status, 200);
  assert.equal((await call("/api/admin/visitors/export", { cookie: adminCookie })).status, 200);
  assert.equal((await call("/api/auth/logout", { method: "POST", cookie: adminCookie })).status, 200);
  assert.equal((await call("/api/visitors", { cookie: adminCookie })).status, 401);
  await sql`UPDATE sessions SET expires_at = now() - interval '1 second'`;
  assert.equal((await call("/api/visitors", { cookie: guardCookie })).status, 401);
  for (let i = 0; i < 11; i++) {
    const result = await call("/api/auth/login", { method: "POST", body: { username: "does-not-exist", password: "wrong" } });
    assert.equal(result.status, i < 10 ? 401 : 429);
  }
  const snapshotDirectory = ".cache/export-test";
  await exportData(snapshotDirectory);
  const exportedUsers = JSON.parse(await readFile(`${snapshotDirectory}/data/users.json`, "utf8"));
  assert.equal(exportedUsers.length, 2);
  assert.ok(exportedUsers.every((user) => user.passwordHash.startsWith("scrypt$") && !user.password));
  await sql`TRUNCATE users, visitors, sessions, rate_limits, quiz_attempts, videos, questions, data_imports CASCADE`;
  await importData(`${snapshotDirectory}/data`, `${snapshotDirectory}/public`);
  assert.equal(Number((await sql`SELECT count(*) FROM visitors`)[0].count), 2);
  assert.equal(Number((await sql`SELECT count(*) FROM users`)[0].count), 2);
  assert.equal((await login("admin")).status, 200);
  assert.equal((await call(video.url, { headers: { Range: "bytes=0-8" } })).status, 206);
  console.log("PASS: standalone server, migrations, idempotent import, pages, roles, CSRF, login/logout/expiry/rate limits, media ranges, quiz replay/concurrency, export and restoration of data/accounts/media.");
} catch (error) { console.error(logs); throw error; }
finally { server?.kill(); await closeDatabase(); }
