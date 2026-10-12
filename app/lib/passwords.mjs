import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new Error("Hasło musi mieć od 12 do 128 znaków.");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = await derive(password, salt, 64, options);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [algorithm, salt, hash] = String(encoded).split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
