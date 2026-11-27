import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend's GET /api/version returned in the footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.ok(),
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(`v${version}`);
  });

  test("shows the footer without a version when GET /api/version fails", async ({ page }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
