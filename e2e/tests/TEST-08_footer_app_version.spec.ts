import { test, expect, type Page } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const VERSION_PATH = "/api/version";
const backendVersion = readBackendVersion();

/**
 * Matches the backend version call on its exact pathname.
 *
 * A glob such as `**\/api/version*` also matches Vite's module URL for
 * `src/api/version.ts`, so the pathname is compared exactly.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

async function fulfilVersionWith(page: Page, version: string): Promise<void> {
  await page.route(isVersionApiUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ version }),
    }),
  );
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the backend version from backend/pyproject.toml in the footer", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-version")).toBeVisible();
  });

  test("shows the version the backend reports, not the frontend's own", async ({ page }) => {
    await fulfilVersionWith(page, "9.9.9-e2e");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9-e2e");
  });

  test("renders exactly the app name when /api/version is unreachable", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) => route.abort("connectionrefused"));

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
