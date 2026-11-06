import { test, expect } from "@playwright/test";

const isVersionResponse = (url: string) => new URL(url).pathname === "/api/version";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend answered", async ({ page }) => {
    const versionResponse = page.waitForResponse((response) => isVersionResponse(response.url()));
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("shows the app name alone when /api/version cannot be reached", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
