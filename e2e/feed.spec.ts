import { expect, signUpAndVerify, test, uniqueEmail } from "./helpers";
import { seedDigest } from "./seed";

test("fil : détail dépliable, favoris, notes et recherche", async ({ page }) => {
  const email = uniqueEmail();
  await signUpAndVerify(page, email);
  await seedDigest(email);

  await page.goto("/veilles");
  const react = page.getByTestId("digest-item").filter({ hasText: "React 20 sort en version stable" });
  await expect(page.getByTestId("digest-item")).toHaveCount(2);
  await expect(react.getByText("React 20 stabilise le compilateur")).toBeHidden();

  await react.getByText("React 20 sort en version stable").click();
  await expect(react.getByText("React 20 stabilise le compilateur")).toBeVisible();
  const source = react.getByRole("link", { name: "React 20" });
  await expect(source).toHaveAttribute("href", "https://react.dev/blog/react-20");
  await expect(source).toHaveAttribute("rel", "noopener noreferrer");

  // Le détail reste déplié après chaque action.
  await react.getByRole("button", { name: "☆ Favori" }).click();
  await expect(react.getByRole("button", { name: "★ Favori" })).toHaveAttribute("aria-pressed", "true");
  await react.getByRole("button", { name: "Utile", exact: true }).click();
  await expect(react.getByRole("button", { name: "Utile", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(react.getByRole("button", { name: "Pas utile" })).toHaveAttribute("aria-pressed", "false");

  await page.getByLabel("Favoris").check();
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page.getByTestId("digest-item")).toHaveCount(1);
  await expect(page.getByTestId("digest-item")).toContainText("React 20");

  await page.getByRole("link", { name: "Réinitialiser" }).click();
  await expect(page).toHaveURL(/\/veilles$/);
  await expect(page.getByTestId("digest-item")).toHaveCount(2);
  await page.getByLabel("Rechercher").fill("infobulles");
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page.getByTestId("digest-item")).toHaveCount(1);
  await expect(page.getByTestId("digest-item")).toContainText("anchor-positioning");

  await page.getByLabel("Rechercher").fill("kubernetes");
  await page.getByRole("button", { name: "Filtrer" }).click();
  await expect(page.getByText("Aucune info ne correspond à ces filtres.")).toBeVisible();
});
