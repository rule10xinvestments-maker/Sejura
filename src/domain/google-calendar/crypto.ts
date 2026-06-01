import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be set server-side.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptGoogleToken(rawToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(rawToken, "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url")
  ].join(".");
}

export function decryptGoogleToken(encryptedToken: string) {
  const [version, iv, authTag, encrypted] = encryptedToken.split(".");
  if (version !== "v1" || !iv || !authTag || !encrypted) {
    throw new Error("Invalid encrypted Google token.");
  }

  const decipher = createDecipheriv(
    algorithm,
    getKey(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final()
  ]).toString("utf8");
}
