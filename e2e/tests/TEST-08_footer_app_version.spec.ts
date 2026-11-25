import { test, expect } from "@playwright/test";

/**
 * Source of truth for the expected version: the footer's own request.
 *
 * The footer shows what `GET /api/version` returns at runtime, so the spec
 * reads the response the page itself receives instead of calling the backend
 * through a second, separately configured base URL. The assertions below still
 * go through the rendered footer. The backend derives its value from
 * backend/pyproject.toml package metadata (TEST-05), so a backend built from
 * this checkout reports that file's version.
 */
const VERSION_PATH = "/api/version";
// The frontend package version that TEST-04 used to show; the footer must not.
const FRONTEND_PACKAGE_VERSION = "0.0.0";

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the backend version in the landing page footer", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === VERSION_PATH,
    );

    await page.goto("/");

    const response = await versionResponse;
    expect(response.ok()).toBe(true);
    const { version } = (await response.json()) as { version: string };
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(version).not.toBe(FRONTEND_PACKAGE_VERSION);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${version}`);
    await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
  });

  test("shows the app name without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort("connectionrefused"),
    );
    // Absence assertions pass instantly, so wait for the aborted request first.
    const versionRequestFailed = page.waitForEvent(
      "requestfailed",
      (request) => new URL(request.url()).pathname === VERSION_PATH,
    );

    await page.goto("/");
    await versionRequestFailed;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
