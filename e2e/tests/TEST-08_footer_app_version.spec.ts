import { test, expect } from "@playwright/test";

const VERSION_PATH = "**/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version from the page's own /api/version response", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/version" && response.ok(),
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${version}`);
    await expect(page.getByTestId("app-footer-version")).toContainText(version);
  });

  test("shows the backend's version, ignoring any other field in the response", async ({
    page,
  }) => {
    await page.route(VERSION_PATH, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "9.9.9", commit: "abc123def456" }),
      }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v9.9.9");
    await expect(footer).not.toContainText("abc123def456");
  });

  test("shows 'version unavailable' when /api/version cannot be reached", async ({ page }) => {
    await page.route(VERSION_PATH, (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes · version unavailable");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("null");
  });
});
