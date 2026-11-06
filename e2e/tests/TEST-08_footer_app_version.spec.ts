import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the browser received from /api/version", async ({ page }) => {
    const responsePromise = page.waitForResponse("**/api/version");
    await page.goto("/");
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    const { version } = (await response.json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${version}`);
    await expect(page.getByTestId("app-footer-version")).toBeVisible();
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
