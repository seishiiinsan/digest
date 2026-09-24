import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-errors";

describe("authErrorMessage", () => {
  it("traduit les codes connus", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 })).toBe("Email ou mot de passe incorrect.");
  });

  it("signale la limite de débit quel que soit le code", () => {
    expect(authErrorMessage({ status: 429 })).toBe("Trop de tentatives, réessayez plus tard.");
  });

  it("ne relaie jamais un message technique inconnu", () => {
    expect(authErrorMessage({ code: "SOMETHING", message: "stack trace" })).toBe("Une erreur est survenue, réessayez.");
  });
});
