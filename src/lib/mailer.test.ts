import { describe, expect, it } from "vitest";
import { resetPasswordMail, verificationMail } from "./mailer";

describe("mails", () => {
  it("inclut le lien en texte et en HTML échappé", () => {
    const url = "https://digest.test/api/auth/verify-email?token=a&callbackURL=/tableau";
    const mail = verificationMail("a@b.test", url);
    expect(mail.to).toBe("a@b.test");
    expect(mail.text).toContain(url);
    expect(mail.html).toContain('href="https://digest.test/api/auth/verify-email?token=a&#38;callbackURL=/tableau"');
  });

  it("précise la durée de validité du lien de réinitialisation", () => {
    expect(resetPasswordMail("a@b.test", "https://digest.test/x").text).toContain("30 minutes");
  });
});
