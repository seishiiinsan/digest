import { signUpAndVerify, test } from "./helpers";
import { deleteUser, seedDigest } from "./seed";

// Captures du README : CAPTURES=1 pnpm test:e2e e2e/captures.spec.ts
// CAPTURES_DIR change le dossier (revue de design : toutes les pages, clair et sombre).
test.skip(!process.env.CAPTURES, "captures uniquement à la demande");

const dir = process.env.CAPTURES_DIR ?? "docs/captures";
const all = Boolean(process.env.CAPTURES_DIR);

for (const colorScheme of all ? (["light", "dark"] as const) : (["light"] as const)) {
  test.describe(colorScheme, () => {
    test.use({ viewport: { width: 1280, height: 900 }, colorScheme });
    const suffix = all ? `-${colorScheme}` : "";

    test(`captures ${colorScheme}`, async ({ page }) => {
      await page.goto("/");
      await page.screenshot({ path: `${dir}/accueil${suffix}.png`, fullPage: all });

      if (all) {
        await page.goto("/inscription");
        await page.screenshot({ path: `${dir}/inscription${suffix}.png` });
      }

      const email = `demo-${colorScheme}@digest.test`;
      await deleteUser(email);
      await signUpAndVerify(page, email);
      await seedDigest(email);

      if (all) {
        await page.goto("/tableau");
        await page.screenshot({ path: `${dir}/tableau${suffix}.png`, fullPage: true });
      }

      await page.goto("/veilles");
      await page.getByTestId("digest-item").first().locator("summary").click();
      await page.screenshot({ path: `${dir}/fil${suffix}.png`, fullPage: true });

      await page.goto("/themes");
      await page.getByRole("button", { name: "+ IA et LLM" }).click();
      await page.getByTestId("topic").nth(1).waitFor();
      await page.screenshot({ path: `${dir}/themes${suffix}.png`, fullPage: true });

      await page.goto("/reglages");
      await page.screenshot({ path: `${dir}/reglages${suffix}.png`, fullPage: true });

      if (all) {
        await page.goto("/executions");
        await page.screenshot({ path: `${dir}/executions${suffix}.png` });
        await page.getByRole("link", { name: /\d{4}/ }).first().click();
        await page.waitForURL(/\/executions\/.+/);
        await page.screenshot({ path: `${dir}/execution${suffix}.png` });
        await page.goto("/veilles");
        await page.getByRole("link", { name: /\d{4}/ }).first().click();
        await page.waitForURL(/\/veilles\/.+/);
        await page.screenshot({ path: `${dir}/edition${suffix}.png`, fullPage: true });
        await page.goto("/nimporte-quoi");
        await page.screenshot({ path: `${dir}/404${suffix}.png` });
      }
    });
  });
}
