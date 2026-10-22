import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version the browser received from /api/version", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.ok(),
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    await page.route(VERSION_URL_PATTERN, (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
