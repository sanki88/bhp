import assert from "node:assert/strict";

export async function testUserManagement(call, sql, adminCookie, guardCookie) {
  const api = "/api/admin/users";
  const initial = await call(api, { cookie: adminCookie });
  assert.equal(initial.status, 200);
  assert.equal(initial.data.users.length, 2);
  assert.ok(initial.data.users.every((user) => !Object.keys(user).some((key) => /password/i.test(key))));
  const actorId = initial.data.currentUserId;
  assert.equal((await call(api)).status, 401);
  for (const method of ["GET", "POST", "PATCH"]) assert.equal((await call(api, { method, cookie: guardCookie, ...(method !== "GET" ? { body: {} } : {}) })).status, 403);
  assert.equal((await call(api, { method: "POST", cookie: adminCookie, origin: "https://other.invalid", body: {} })).status, 403);
  const update = (body, cookie = adminCookie) => call(api, { method: "PATCH", cookie, body });
  const create = (body) => call(api, { method: "POST", cookie: adminCookie, body });
  assert.equal((await update({ id: actorId, action: "disable" })).status, 409);
  assert.equal((await update({ id: "invalid", action: "disable" })).status, 400);
  assert.equal((await update({ id: "11111111-1111-4111-8111-111111111111", action: "disable" })).status, 404);
  assert.equal((await create({ username: "test", role: "owner", password: "Long-test-password-2026" })).status, 400);
  assert.equal((await create({ username: "test", role: "guard", password: "short" })).status, 400);
  assert.equal((await create({ username: "bad username", role: "guard", password: "Long-test-password-2026" })).status, 400);

  const createdIds = [];
  const testPassword = "New-staff-test-password-2026";
  const newPassword = "Reset-staff-test-password-2026";
  const staffLogin = (username, password = testPassword) => call("/api/auth/login", { method: "POST", body: { username, password } });
  try {
    const accounts = [];
    for (const [username, role] of [["Managed-Guard", "guard"], ["managed-admin-one", "admin"], ["managed-admin-two", "admin"]]) {
      const result = await create({ username, role, password: testPassword });
      assert.equal(result.status, 201);
      assert.equal(result.data.user.username, username.toLowerCase());
      assert.equal(result.data.user.role, role);
      assert.ok(!JSON.stringify(result.data).includes(testPassword));
      assert.ok(!Object.keys(result.data.user).some((key) => /password/i.test(key)));
      createdIds.push(result.data.user.id); accounts.push(result.data.user);
    }
    assert.equal((await create({ username: "MANAGED-GUARD", role: "admin", password: testPassword })).status, 409);
    const [guard, firstAdmin, secondAdmin] = accounts;
    const guardSession = await staffLogin(guard.username);
    assert.equal(guardSession.status, 200);
    assert.equal((await call(api, { cookie: guardSession.cookie })).status, 403);
    assert.equal((await update({ id: guard.id, action: "password", password: newPassword })).status, 200);
    assert.equal((await call("/api/visitors", { cookie: guardSession.cookie })).status, 401);
    assert.equal((await staffLogin(guard.username)).status, 401);
    const resetSession = await staffLogin(guard.username, newPassword);
    assert.equal(resetSession.status, 200);
    assert.equal((await update({ id: guard.id, action: "disable" })).status, 200);
    assert.equal((await call("/api/visitors", { cookie: resetSession.cookie })).status, 401);
    assert.equal((await staffLogin(guard.username, newPassword)).status, 401);
    assert.equal((await update({ id: guard.id, action: "enable" })).status, 200);
    assert.equal((await call("/api/visitors", { cookie: resetSession.cookie })).status, 401);
    assert.equal((await staffLogin(guard.username, newPassword)).status, 200);

    const firstSession = await staffLogin(firstAdmin.username);
    const secondSession = await staffLogin(secondAdmin.username);
    assert.equal(firstSession.status, 200); assert.equal(secondSession.status, 200);
    assert.equal((await call("/api/admin/questions", { cookie: firstSession.cookie })).status, 200);
    // Fixture: leave exactly two admins, then race their attempts to disable themselves.
    await sql`UPDATE users SET active = FALSE WHERE id = ${actorId}`;
    const concurrent = await Promise.all([
      update({ id: firstAdmin.id, action: "disable" }, firstSession.cookie),
      update({ id: secondAdmin.id, action: "disable" }, secondSession.cookie),
    ]);
    assert.deepEqual(concurrent.map((result) => result.status).sort(), [200, 409]);
    assert.equal(Number((await sql`SELECT count(*) FROM users WHERE active AND role = 'admin'`)[0].count), 1);
    const remaining = concurrent[0].status === 409 ? { user: firstAdmin, cookie: firstSession.cookie } : { user: secondAdmin, cookie: secondSession.cookie };
    const ownReset = await update({ id: remaining.user.id, action: "password", password: newPassword }, remaining.cookie);
    assert.equal(ownReset.status, 200); assert.equal(ownReset.data.signOut, true);
    assert.equal((await call(api, { cookie: remaining.cookie })).status, 401);
    assert.equal((await staffLogin(remaining.user.username, newPassword)).status, 200);
    console.log("PASS: staff creation, roles, validation, duplicates, password reset, session revocation, blocking/reactivation and concurrent last-admin protection.");
  } finally {
    await sql`UPDATE users SET active = TRUE WHERE id = ${actorId}`;
    for (const id of createdIds) await sql`DELETE FROM users WHERE id = ${id}`;
  }
}
