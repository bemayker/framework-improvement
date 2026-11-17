import { test, expect } from "@playwright/test";

const isVersionResponse = (url: string) => new URL(url).pathname === "/api/version";

test.describe("TEST-08 footer app version", () => {
  test("footer shows the version the backend reports", async ({ page }) => {
    // The expected value is the one the page itself received, so no backend URL or version is hardcoded here.
    const versionResponse = page.waitForResponse((response) => isVersionResponse(response.url()));
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const appVersion = page.getByTestId("app-version");
    await expect(appVersion).toHaveText(` v${version}`);
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("footer shows the app name alone when the version endpoint is unreachable", async ({
    page,
  }) => {
    await page.route((url) => isVersionResponse(url.toString()), (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
