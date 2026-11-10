import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the page's own /api/version response carried", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.request().method() === "GET",
    );
    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("shows exactly the app name when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
