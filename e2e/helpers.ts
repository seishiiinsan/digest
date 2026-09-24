import { expect, type Page } from "@playwright/test";
import { waitForLink } from "./mailpit";

export const password = "Digest-e2e-mot-de-passe-7431";

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@digest.test`;
}

export async function signUpAndVerify(page: Page, email: string) {
  await page.goto("/inscription");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Mot de passe/).fill(password);
  await page.getByLabel("Confirmation").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeVisible();

  await page.goto(await waitForLink(email, "Confirmez votre adresse"));
  await expect(page).toHaveURL(/\/tableau$/);
  await expect(page.getByTestId("user-email")).toHaveText(email);
}

export async function signIn(page: Page, email: string, pwd: string) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(pwd);
  await page.getByRole("button", { name: "Se connecter" }).click();
}
