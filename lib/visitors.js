import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import postgres from "postgres";

const dataDirectory = path.join(process.cwd(), "data");
const visitorsFile = process.env.VERCEL
  ? path.join("/tmp", "bhp-visitors.json")
  : path.join(dataDirectory, "visitors.json");
const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl
  ? postgres(databaseUrl, {
      max: 1,
      ssl: databaseUrl.includes("localhost") ? false : "require",
    })
  : null;

export async function getVisitors() {
  if (sql) {
    await ensureDatabase();
    const visitors = await sql`
      SELECT
        id,
        pass_number AS "passNumber",
        completed_at AS "completedAt",
        expires_at AS "expiresAt",
        first_name AS "firstName",
        last_name AS "lastName",
        phone,
        company,
        visit_purpose AS "visitPurpose",
        quiz_score AS "quizScore"
      FROM visitors
      ORDER BY completed_at DESC
    `;

    return visitors.map((visitor) => ({
      ...visitor,
      expiresAt: visitor.expiresAt || addMonths(visitor.completedAt, 6),
    }));
  }

  await ensureStore();
  const file = await fs.readFile(visitorsFile, "utf8");
  const visitors = JSON.parse(file);

  return visitors
    .map((visitor) => ({
      ...visitor,
      expiresAt: visitor.expiresAt || addMonths(visitor.completedAt, 6),
    }))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export async function addVisitor(visitor) {
  const completedAt = new Date();
  const storedVisitor = {
    id: randomUUID(),
    passNumber: createPassNumber(),
    completedAt: completedAt.toISOString(),
    expiresAt: addMonths(completedAt, 6),
    ...visitor,
  };

  if (sql) {
    await ensureDatabase();
    await sql`
      INSERT INTO visitors (
        id,
        pass_number,
        completed_at,
        expires_at,
        first_name,
        last_name,
        phone,
        company,
        visit_purpose,
        quiz_score
      )
      VALUES (
        ${storedVisitor.id},
        ${storedVisitor.passNumber},
        ${storedVisitor.completedAt},
        ${storedVisitor.expiresAt},
        ${storedVisitor.firstName},
        ${storedVisitor.lastName},
        ${storedVisitor.phone},
        ${storedVisitor.company},
        ${storedVisitor.visitPurpose},
        ${storedVisitor.quizScore}
      )
    `;

    return storedVisitor;
  }

  await ensureStore();
  const visitors = await getVisitors();
  visitors.unshift(storedVisitor);
  await fs.writeFile(visitorsFile, JSON.stringify(visitors, null, 2), "utf8");

  return storedVisitor;
}

async function ensureDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      pass_number TEXT NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      visit_purpose TEXT NOT NULL,
      quiz_score INTEGER NOT NULL
    )
  `;
}

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(visitorsFile);
  } catch {
    await fs.writeFile(visitorsFile, "[]", "utf8");
  }
}

function createPassNumber() {
  const datePart = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `BHP-${datePart}-${randomPart}`;
}

function addMonths(value, months) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}
