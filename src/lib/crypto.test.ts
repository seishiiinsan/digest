import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decrypt, encrypt, parseMasterKey } from "./crypto";

const key = randomBytes(32);

describe("crypto", () => {
  it("chiffre puis déchiffre", () => {
    const secret = "sk-ant-api03-exemple";
    const encrypted = encrypt(secret, key);
    expect(encrypted.ciphertext).not.toContain("sk-ant");
    expect(decrypt(encrypted, key)).toBe(secret);
  });

  it("utilise un IV différent à chaque chiffrement", () => {
    expect(encrypt("x", key).iv).not.toBe(encrypt("x", key).iv);
  });

  it("refuse un texte chiffré altéré ou une autre clé", () => {
    const encrypted = encrypt("secret", key);
    const tampered = { ...encrypted, ciphertext: Buffer.from("autre").toString("base64") };
    expect(() => decrypt(tampered, key)).toThrow();
    expect(() => decrypt(encrypted, randomBytes(32))).toThrow();
  });

  it("valide la clé maître", () => {
    expect(() => parseMasterKey(undefined)).toThrow("ENCRYPTION_KEY manquante");
    expect(() => parseMasterKey(Buffer.alloc(16).toString("base64"))).toThrow("32 octets");
    expect(parseMasterKey(key.toString("base64"))).toHaveLength(32);
  });
});
