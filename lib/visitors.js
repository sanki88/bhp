import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dataDirectory = path.join(process.cwd(), "data");
const visitorsFile = process.env.VERCEL
  ? path.join("/tmp", "bhp-visitors.json")
  : path.join(dataDirectory, "visitors.json");

export async function getVisitors() {
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
  await ensureStore();

  const visitors = await getVisitors();
  const completedAt = new Date();
  const storedVisitor = {
    id: randomUUID(),
    passNumber: createPassNumber(),
    completedAt: completedAt.toISOString(),
    expiresAt: addMonths(completedAt, 6),
    ...visitor,
  };

  visitors.unshift(storedVisitor);
  await fs.writeFile(visitorsFile, JSON.stringify(visitors, null, 2), "utf8");

  return storedVisitor;
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
