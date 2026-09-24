import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdmin, signupEnabled } from "./instance";

afterEach(() => vi.unstubAllEnvs());

describe("instance", () => {
  it("inscriptions ouvertes par défaut", () => {
    vi.stubEnv("SIGNUP_ENABLED", "");
    expect(signupEnabled()).toBe(true);
    vi.stubEnv("SIGNUP_ENABLED", "false");
    expect(signupEnabled()).toBe(false);
  });

  it("admins listés dans ADMIN_EMAILS, sans tenir compte de la casse", () => {
    vi.stubEnv("ADMIN_EMAILS", " admin@digest.test , Gabin@Digest.test");
    expect(isAdmin("gabin@digest.test")).toBe(true);
    expect(isAdmin("autre@digest.test")).toBe(false);
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(isAdmin("")).toBe(false);
  });
});
