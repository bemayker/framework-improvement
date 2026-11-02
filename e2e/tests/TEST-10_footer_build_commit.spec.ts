import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches on the exact pathname: a substring match would also catch Vite
 * serving the client module `src/api/version.ts`.
 */
async function stubVersionResponse(page: Page, version: string, commit: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version, commit }),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await stubVersionResponse(page, "0.1.0", "a1b2c3d4e5f6");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (a1b2c3d)");
  });

  test("shows the version alone when the backend reports an unknown commit", async ({ page }) => {
    await stubVersionResponse(page, "0.1.0", "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0");
    await expect(footer).not.toContainText(/undefined|null|unknown|\(\)/);
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    await page.route((url) => url.pathname === VERSION_PATH, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown|\(\)/);
  });
});
