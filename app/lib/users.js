import { randomUUID } from "node:crypto";
import { getSql } from "./database.mjs";
import { hashPassword } from "./passwords.mjs";
import { HttpError } from "./http";

export async function getManagedUsers() {
  return getSql()`SELECT id, username, role, active, created_at AS "createdAt" FROM users ORDER BY active DESC, role, username`;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new HttpError(400, "Hasło musi mieć od 12 do 128 znaków.");
  }
}

async function withAdministrator(actorId, action) {
  return getSql().begin(async (sql) => {
    // Serialize account changes so concurrent requests cannot remove the last admin.
    await sql`LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE`;
    const [actor] = await sql`SELECT id FROM users WHERE id = ${actorId} AND active AND role = 'admin'`;
    if (!actor) throw new HttpError(403, "Brak uprawnień do zarządzania użytkownikami.");
    return action(sql);
  });
}

export async function createManagedUser(actorId, payload) {
  const username = typeof payload.username === "string" ? payload.username.trim().toLowerCase() : "";
  if (!/^[a-z0-9._-]{3,80}$/.test(username)) throw new HttpError(400, "Login musi mieć 3–80 znaków: litery a–z, cyfry, kropka, myślnik lub podkreślenie.");
  if (!["admin", "guard"].includes(payload.role)) throw new HttpError(400, "Wybierz rolę administratora lub ochrony.");
  validatePassword(payload.password);
  const passwordHash = await hashPassword(payload.password);
  try {
    return await withAdministrator(actorId, async (sql) => {
      const [user] = await sql`INSERT INTO users (id, username, password_hash, role)
        VALUES (${randomUUID()}, ${username}, ${passwordHash}, ${payload.role})
        RETURNING id, username, role, active, created_at AS "createdAt"`;
      return user;
    });
  } catch (error) {
    if (error.code === "23505") throw new HttpError(409, "Ten login jest już zajęty. Wybierz inny.");
    throw error;
  }
}

export async function updateManagedUser(actorId, payload) {
  if (typeof payload.id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(payload.id)) {
    throw new HttpError(400, "Nieprawidłowy identyfikator użytkownika.");
  }
  if (!["password", "disable", "enable"].includes(payload.action)) throw new HttpError(400, "Nieprawidłowa operacja.");
  let passwordHash;
  if (payload.action === "password") {
    validatePassword(payload.password);
    passwordHash = await hashPassword(payload.password);
  }
  return withAdministrator(actorId, async (sql) => {
    const [user] = await sql`SELECT id, username, role, active, created_at AS "createdAt" FROM users WHERE id = ${payload.id}`;
    if (!user) throw new HttpError(404, "Nie znaleziono użytkownika.");
    if (payload.action === "disable" && user.active && user.role === "admin") {
      const [{ count }] = await sql`SELECT count(*)::int AS count FROM users WHERE active AND role = 'admin'`;
      if (count <= 1) throw new HttpError(409, "Nie można zablokować ostatniego aktywnego administratora.");
    }
    if (payload.action === "password") {
      await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user.id}`;
    } else {
      user.active = payload.action === "enable";
      await sql`UPDATE users SET active = ${user.active} WHERE id = ${user.id}`;
    }
    // Reactivating an account never restores any previously issued session.
    await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    return user;
  });
}
