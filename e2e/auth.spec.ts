import { expect, test } from "@playwright/test";
import { password, signIn, signUpAndVerify, uniqueEmail } from "./helpers";
import { waitForLink } from "./mailpit";

test("inscription, vérification de l'email, déconnexion puis connexion", async ({ page }) => {
  const email = uniqueEmail();
  await signUpAndVerify(page, email);

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/connexion$/);
  await page.goto("/tableau");
  await expect(page).toHaveURL(/\/connexion$/);

  await signIn(page, email, "mauvais-mot-de-passe");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email ou mot de passe incorrect.");

  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/tableau$/);
  await expect(page.getByTestId("user-email")).toHaveText(email);
});

test("connexion refusée tant que l'email n'est pas vérifié", async ({ page }) => {
  const email = uniqueEmail();
  await page.goto("/inscription");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Mot de passe/).fill(password);
  await page.getByLabel("Confirmation").fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez votre boîte mail" })).toBeVisible();

  await signIn(page, email, password);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Adresse non vérifiée");
});

test("mot de passe oublié puis connexion avec le nouveau", async ({ page }) => {
  const email = uniqueEmail();
  const newPassword = "Digest-e2e-nouveau-mdp-9051";
  await signUpAndVerify(page, email);
  await page.getByRole("button", { name: "Se déconnecter" }).click();

  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Envoyer le lien" }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Si un compte existe");

  await page.goto(await waitForLink(email, "Réinitialisez votre mot de passe"));
  await expect(page).toHaveURL(/\/reinitialiser\?token=/);
  await page.getByLabel(/^Nouveau mot de passe/).fill(newPassword);
  await page.getByLabel("Confirmation").fill(newPassword);
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await expect(page).toHaveURL(/\/connexion\?reinitialise=1$/);
  await signIn(page, email, password);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email ou mot de passe incorrect.");
  await signIn(page, email, newPassword);
  await expect(page).toHaveURL(/\/tableau$/);
});

test("suppression du compte", async ({ page }) => {
  const email = uniqueEmail();
  await signUpAndVerify(page, email);

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(page).toHaveURL("/");

  await signIn(page, email, password);
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Email ou mot de passe incorrect.");
});
