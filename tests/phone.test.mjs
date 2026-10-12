import test from "node:test";
import assert from "node:assert/strict";
import { isValidPhone } from "../app/lib/phone.mjs";

test("phone accepts digits and the requested formatting without changing the number", () => {
  for (const value of ["123456789", "+48 (123) 456-789", " 0049 123 456 789 ", "0", "1".repeat(160)]) {
    assert.equal(isValidPhone(value), true, JSON.stringify(value));
  }
});
test("phone rejects letters, other punctuation, control characters and numbers with no digits", () => {
  for (const value of ["", "   ", "+ () -", "123abc", "123.456", "123/456", "123\n", "\n123", "123\t456", "123\r\n", "123\u00a0456", "１２３", "123☎", "1".repeat(161), null, undefined, 123, {}]) {
    assert.equal(isValidPhone(value), false, JSON.stringify(value));
  }
});
