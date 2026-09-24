import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hache en Argon2id et vérifie", async () => {
    const digest = await hashPassword("correct horse battery");
    expect(digest).toMatch(/^\$argon2id\$/);
    await expect(verifyPassword({ hash: digest, password: "correct horse battery" })).resolves.toBe(true);
    await expect(verifyPassword({ hash: digest, password: "wrong horse battery" })).resolves.toBe(false);
  });
});
