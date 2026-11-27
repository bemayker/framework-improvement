import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the commit next to the version in the footer", async ({
    page,
  }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "1.2.3", commit: "abcdef1234567890" }),
      }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v1.2.3 (abcdef1)");
    await expect(page.getByTestId("app-footer-commit")).toContainText("abcdef1");
  });

  test("shows the footer without a commit when GET /api/version fails", async ({ page }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
