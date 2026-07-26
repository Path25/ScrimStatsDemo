import { expect, test, type Page } from "@playwright/test";

const roles = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/(overview|workspaces)/);
}

test.describe("public launch surface", () => {
  for (const route of ["/", "/request-access", "/sign-in", "/privacy", "/terms", "/support", "/status"]) {
    test(`${route} renders without a runtime failure`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).not.toContainText("Cannot read properties of undefined");
      await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
      await expect(page.locator("main")).toBeVisible();
    });
  }

  test("unknown public route returns an honest 404", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText(/route unavailable/i)).toBeVisible();
  });

  test("password recovery journey is reachable", async ({ page }) => {
    await page.goto("/sign-in");
    const recoveryLink = page.getByRole("link", { name: /forgot(?: your)? password/i });
    await expect(recoveryLink).toHaveAttribute("href", "/forgot-password");
    await page.goto("/forgot-password");
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.getByRole("heading", { name: /reset your password/i })).toBeVisible();
  });
});

for (const role of roles) {
  test.describe(`${role.toLowerCase()} workspace`, () => {
    test.skip(!process.env[`E2E_${role}_EMAIL`] || !process.env[`E2E_${role}_PASSWORD`], `Set E2E_${role}_EMAIL and E2E_${role}_PASSWORD to run this pilot role journey.`);
    test("active routes render and role controls remain honest", async ({ page }) => {
      await signIn(page, process.env[`E2E_${role}_EMAIL`]!, process.env[`E2E_${role}_PASSWORD`]!);
      for (const route of ["/overview", "/players", "/calendar", "/scrims", "/actions", "/soloq", "/analytics", "/scouting", "/draft", "/integrations", "/settings"]) {
        await page.goto(route);
        await expect(page.locator("body")).not.toContainText(/Cannot read properties|relation .* does not exist|schema cache/i);
        await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
      }
      if (role === "MEMBER" || role === "VIEWER") {
        await page.goto("/actions");
        await expect(page.getByRole("button", { name: /create action/i })).toHaveCount(0);
      }
    });
  });
}

test.describe("platform operations", () => {
  test.skip(!process.env.E2E_OPERATOR_EMAIL || !process.env.E2E_OPERATOR_PASSWORD, "Set operator pilot credentials to exercise /ops.");
  test("allowlisted operator can open managed-pilot controls", async ({ page }) => {
    await signIn(page, process.env.E2E_OPERATOR_EMAIL!, process.env.E2E_OPERATOR_PASSWORD!);
    await page.goto("/ops");
    await expect(page.getByRole("heading", { name: "Pilot operations" })).toBeVisible();
    await expect(page.getByText(/Provision workspace/i)).toBeVisible();
  });
});
