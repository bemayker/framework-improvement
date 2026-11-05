import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the app version", () => {
  test("footer reads the version the browser received from /api/version", async ({ page }) => {
    const versionResponse = page.waitForResponse("**/api/version");
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("footer reads exactly Task Notes when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
