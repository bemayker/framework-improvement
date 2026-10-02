import { test, expect } from "@playwright/test";

const isVersionRequest = (url: string) => new URL(url).pathname === "/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend's /api/version response carried", async ({ page }) => {
    const versionResponse = page.waitForResponse((response) => isVersionRequest(response.url()));
    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-version")).toHaveText(version);
    await expect(page.getByTestId("app-footer")).toContainText(`Task Notes v${version}`);
  });

  test("renders the footer without a version when /api/version cannot be reached", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
