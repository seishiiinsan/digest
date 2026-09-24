import { hash, verify } from "@node-rs/argon2";

// Argon2id (algorithme par défaut de @node-rs/argon2), paramètres recommandés OWASP.
const options = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, options);
}

export function verifyPassword({ hash: digest, password }: { hash: string; password: string }): Promise<boolean> {
  return verify(digest, password);
}
