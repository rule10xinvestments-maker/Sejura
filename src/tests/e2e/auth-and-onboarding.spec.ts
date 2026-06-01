import { expect, test } from "@playwright/test";

test("home and auth screens render Romanian-first positioning", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sejura" })).toBeVisible();
  await expect(
    page.getByText("Asistent de rezervari pentru pensiuni, cabane si vile locale.")
  ).toBeVisible();

  await page.getByRole("link", { name: "Creeaza cont" }).click();
  await expect(page.getByRole("heading", { name: "Creeaz\u0103 cont" })).toBeVisible();
  await expect(page.getByLabel("Confirm\u0103 parola")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continu\u0103 cu Google" })).toBeVisible();
});

test("sign-in screen renders Google login button", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Intr\u0103 in cont" })).toBeVisible();
  await expect(page.getByLabel("Parol\u0103")).toBeVisible();
  await expect(page.getByLabel("Confirm\u0103 parola")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Continu\u0103 cu Google" })).toBeVisible();
});

test("auth callback redirects missing code safely", async ({ page }) => {
  await page.goto("/auth/callback?next=/app");
  await expect(page).toHaveURL(/\/sign-in\?error=google-auth-missing-code/);
});

test("protected app redirects unauthenticated owners", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("onboarding smoke requires Supabase auth env for full create flow", async ({
  page
}) => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.E2E_OWNER_EMAIL ||
      !process.env.E2E_OWNER_PASSWORD,
    "Supabase auth env and test owner credentials are required for full onboarding."
  );

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(process.env.E2E_OWNER_EMAIL!);
  await page.getByLabel("Parol\u0103").fill(process.env.E2E_OWNER_PASSWORD!);
  await page.getByRole("button", { name: "Intr\u0103" }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.goto("/app/onboarding");
  await expect(
    page.getByRole("heading", { name: "Porneste cu baza corecta" })
  ).toBeVisible();
});
