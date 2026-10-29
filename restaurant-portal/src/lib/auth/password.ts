import crypto from "crypto";

/**
 * Hashes a plaintext password using PBKDF2 with SHA-512 and a random 16-byte salt.
 * Output format: `salt:hash`
 */
export function hashPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(plainText.trim(), salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Constant-time password verification against PBKDF2 SHA-512 hash.
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!plainText || !storedHash) return false;

  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    try {
      const a = Buffer.from(plainText.trim());
      const b = Buffer.from(storedHash.trim());
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  const [salt, hash] = parts;
  try {
    const computedHash = crypto
      .pbkdf2Sync(plainText.trim(), salt, 10000, 64, "sha512")
      .toString("hex");

    const computedBuf = Buffer.from(computedHash, "hex");
    const storedBuf = Buffer.from(hash, "hex");

    if (computedBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(computedBuf, storedBuf);
  } catch {
    return false;
  }
}
