import { expect, test } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test.beforeEach(async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail());
});

test("une clé invalide est refusée avec un message clair", async ({ page }) => {
  await page.goto("/reglages");
  const apiKey = page.getByLabel("Clé API");

  await apiKey.fill("sk-proj-pas-une-cle-anthropic");
  await page.getByRole("button", { name: "Tester et enregistrer" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Format de clé invalide : une clé Anthropic commence par sk-ant-.",
  );

  // Appel réel à l'API : Anthropic répond 401.
  await apiKey.fill(`sk-ant-api03-${"x".repeat(40)}`);
  await page.getByRole("button", { name: "Tester et enregistrer" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText(
    "Clé refusée par Anthropic : elle est invalide ou révoquée.",
    { timeout: 20_000 },
  );
  await expect(page.getByTestId("api-key-status")).toHaveCount(0);
});

test("thèmes : création, modèle, modification, désactivation, suppression", async ({ page }) => {
  await page.goto("/themes");
  await page.getByRole("link", { name: "Nouveau thème" }).click();
  await page.getByLabel("Titre").fill("Next.js");
  await page.getByLabel("Mots-clés").fill("RSC, App Router");
  await page.getByLabel("Sources à privilégier").fill("https://www.nextjs.org/blog\nreact.dev");
  await page.getByRole("button", { name: "Créer le thème" }).click();

  await expect(page).toHaveURL(/\/themes$/);
  const topic = page.getByTestId("topic").filter({ hasText: "Next.js" });
  await expect(topic).toContainText("RSC · App Router");

  await page.getByRole("button", { name: "+ Sécurité" }).click();
  await expect(page.getByTestId("topic")).toHaveCount(2);

  await topic.getByRole("link", { name: "Modifier" }).click();
  await expect(page.getByLabel("Sources à privilégier")).toHaveValue("nextjs.org\nreact.dev");
  await page.getByLabel("Sources à exclure").fill("pas un domaine");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Domaine invalide : pas un domaine");
  await page.getByLabel("Sources à exclure").fill("");
  await page.getByLabel("Titre").fill("Next.js et React");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  const renamed = page.getByTestId("topic").filter({ hasText: "Next.js et React" });
  await renamed.getByRole("button", { name: "Désactiver" }).click();
  await expect(renamed).toContainText("désactivé");
  await renamed.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByTestId("topic")).toHaveCount(1);
});

test("planning, préférences et webhook", async ({ page }) => {
  await page.goto("/reglages");

  await page.getByLabel("Fuseau horaire").selectOption("America/New_York");
  await page.getByLabel("Langue des veilles").selectOption("en");
  await page.getByRole("button", { name: "Enregistrer" }).nth(1).click();
  await expect(page.getByText("Préférences enregistrées.")).toBeVisible();

  await page.getByLabel("Fréquence").selectOption("weekly");
  await page.getByLabel("Jour").selectOption("1");
  await page.getByLabel("Heure").selectOption("9");
  await page.getByRole("button", { name: "Enregistrer" }).nth(2).click();
  await expect(page.getByText("Planning enregistré.")).toBeVisible();
  await expect(page.getByTestId("next-run")).toContainText(/lundi .* 09:00/);

  await page.getByLabel("URL du webhook").fill("https://example.com/hook");
  await page.getByRole("button", { name: "Enregistrer le webhook" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("URL non reconnue");
  await page.getByLabel("URL du webhook").fill("https://discord.com/api/webhooks/123456/secret-token-abcd");
  await page.getByRole("button", { name: "Enregistrer le webhook" }).click();
  await expect(page.getByTestId("webhook-status")).toHaveText("Discord : discord.com/api/webhooks/123456/…abcd");
  await expect(page.getByText("secret-token")).toHaveCount(0);
});
