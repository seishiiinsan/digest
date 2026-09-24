import { signUpAndVerify, test } from "./helpers";
import { deleteUser, seedDigest } from "./seed";

// Captures du README : CAPTURES=1 pnpm test:e2e e2e/captures.spec.ts
test.skip(!process.env.CAPTURES, "captures du README uniquement");
test.use({ viewport: { width: 1100, height: 900 }, colorScheme: "light" });

test("captures du README", async ({ page }) => {
  const dir = "docs/captures";
  await page.goto("/");
  await page.screenshot({ path: `${dir}/accueil.png` });

  const email = "demo@digest.test";
  await deleteUser(email);
  await signUpAndVerify(page, email);
  await seedDigest(email);

  await page.goto("/veilles");
  await page.getByTestId("digest-item").first().locator("summary").click();
  await page.screenshot({ path: `${dir}/fil.png`, fullPage: true });

  await page.goto("/themes");
  await page.getByRole("button", { name: "+ IA et LLM" }).click();
  await page.getByTestId("topic").first().waitFor();
  await page.screenshot({ path: `${dir}/themes.png`, fullPage: true });

  await page.goto("/reglages");
  await page.screenshot({ path: `${dir}/reglages.png`, fullPage: true });
});
