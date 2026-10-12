import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../app/lib/passwords.mjs";

test("password hashes use unique salts, verify correctly and reject invalid input", async () => {
  const password = "Test-only-password-2026";
  const a = await hashPassword(password);
  const b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(await verifyPassword(password, "invalid"), false);
  await assert.rejects(hashPassword("1234"));
});
