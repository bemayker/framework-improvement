import { test, expect } from "@playwright/test";

/**
 * Source of truth for the expected version: the backend under test itself.
 *
 * The footer shows what `GET /api/version` returns at runtime, so the spec
 * asks the same running backend instead of reading backend/pyproject.toml,
 * which would only agree when the backend was built from this checkout. The
 * request is test setup, not the behaviour under test: the assertions below
 * still go through the rendered footer. The backend derives its value from
 * backend/pyproject.toml package metadata (TEST-05), so a backend built from
 * this checkout reports that file's version.
 */
const API_BASE_URL = process.env.PLAYWRIGHT_API_BASE_URL ?? "http://localhost:8010";
const VERSION_PATH = "/api/version";
// The frontend package version that TEST-04 used to show; the footer must not.
const FRONTEND_PACKAGE_VERSION = "0.0.0";

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the backend version in the landing page footer", async ({ page, request }) => {
    const response = await request.get(`${API_BASE_URL}${VERSION_PATH}`);
    expect(response.ok()).toBe(true);
    const { version } = (await response.json()) as { version: string };
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(version).not.toBe(FRONTEND_PACKAGE_VERSION);

    await page.goto("/");

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

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
