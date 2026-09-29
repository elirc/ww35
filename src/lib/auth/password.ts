// Password hashing utilities for the learning project.
// What calls this file: authService and prisma seed data creation.
// What it calls: Node's crypto module only.
// Junior pitfall: storing plain passwords or comparing them with string equality.

import crypto from "node:crypto";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `pbkdf2_${ITERATIONS}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHash] = storedHash.split("$");
  if (!algorithm?.startsWith("pbkdf2_") || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(algorithm.replace("pbkdf2_", ""));
  const actualHash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}
