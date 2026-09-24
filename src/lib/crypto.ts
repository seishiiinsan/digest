import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM, IV aléatoire par valeur. La clé maître vit dans ENCRYPTION_KEY (32 octets en base64), jamais en base.
export interface Encrypted {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function parseMasterKey(value: string | undefined): Buffer {
  if (!value) throw new Error("ENCRYPTION_KEY manquante");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY doit faire 32 octets en base64 (openssl rand -base64 32)");
  return key;
}

function masterKey(): Buffer {
  return parseMasterKey(process.env.ENCRYPTION_KEY);
}

export function encrypt(plaintext: string, key: Buffer = masterKey()): Encrypted {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decrypt({ ciphertext, iv, authTag }: Encrypted, key: Buffer = masterKey()): string {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}
