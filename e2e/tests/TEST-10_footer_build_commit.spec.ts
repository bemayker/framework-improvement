import { test, expect } from "@playwright/test";

const VERSION = "0.1.0";

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the short build commit next to the version in the footer", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: VERSION, commit: "62be9fd76e4b" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${VERSION} (62be9fd)`);
  });

  test("shows the version alone when the backend reports an unknown commit", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: VERSION, commit: "unknown" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${VERSION}`);
  });
});
