import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend served on the landing page", async ({ page }) => {
    const versionResponse = page.waitForResponse("**/api/version");
    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText(`Task Notes v${version}`);
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${version}`);
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
