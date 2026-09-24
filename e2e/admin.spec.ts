import { expect, signUpAndVerify, test, uniqueEmail } from "./helpers";
import { deleteUser } from "./seed";

// ADMIN_EMAILS=admin-e2e@digest.test est passé au serveur par playwright.config.ts.
test("seul un admin voit la liste des comptes", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail());
  await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  const response = await page.goto("/admin");
  expect(response?.status()).toBe(404);
});

test("l'admin voit les comptes de l'instance", async ({ page }) => {
  await deleteUser("admin-e2e@digest.test");
  await signUpAndVerify(page, "admin-e2e@digest.test");
  await page.getByRole("link", { name: "Admin" }).click();
  await expect(page.getByRole("heading", { name: "Instance" })).toBeVisible();
  await expect(page.getByTestId("admin-users")).toContainText("admin-e2e@digest.test");
  await expect(page.getByText("inscriptions ouvertes")).toBeVisible();
});
