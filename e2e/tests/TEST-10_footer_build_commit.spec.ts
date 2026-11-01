import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact pathname.
 *
 * A glob such as `**\/api/version*` also matches Vite's module URL for
 * `src/api/version.ts`, so the pathname is compared exactly.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

async function fulfilBuildWith(page: Page, version: string, commit: string): Promise<void> {
  await page.route(isVersionApiUrl, (route) =>
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
    await fulfilBuildWith(page, "9.9.9-e2e", "0123456789ab");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9-e2e (0123456)");
    await expect(page.getByTestId("app-commit")).toBeVisible();
  });

  test("shows the version alone when the backend commit is unknown", async ({ page }) => {
    await fulfilBuildWith(page, "9.9.9-e2e", "unknown");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9-e2e");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });

  test("renders exactly the app name when /api/version is unreachable", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) => route.abort("connectionrefused"));

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
