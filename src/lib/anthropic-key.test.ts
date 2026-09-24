import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { describeKeyError, looksLikeAnthropicKey } from "./anthropic-key";

function apiError(status: number, message: string) {
  return Anthropic.APIError.generate(status, { type: "error", error: { type: "x", message } }, message, new Headers());
}

describe("anthropic key", () => {
  it("vérifie le format", () => {
    expect(looksLikeAnthropicKey("sk-ant-api03-" + "a".repeat(40))).toBe(true);
    expect(looksLikeAnthropicKey("sk-proj-abc")).toBe(false);
    expect(looksLikeAnthropicKey("sk-ant-short")).toBe(false);
  });

  it("traduit les erreurs de l'API", () => {
    expect(describeKeyError(apiError(401, "invalid x-api-key"))).toContain("invalide");
    expect(describeKeyError(apiError(400, "Your credit balance is too low to access the Anthropic API."))).toContain("Crédit insuffisant");
    expect(describeKeyError(apiError(429, "rate limited"))).toContain("Limite de débit");
    expect(describeKeyError(apiError(404, "model not found"))).toContain("modèle");
    expect(describeKeyError(apiError(400, "other"))).toBe("La clé n'a pas pu être vérifiée, réessayez.");
  });
});
