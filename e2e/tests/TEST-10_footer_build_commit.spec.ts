import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

// CI's compose build sets no BUILD_COMMIT, so the real backend would only ever
// answer "unknown". The response is fulfilled with a fixed body instead.
const STUBBED_VERSION = "0.1.0";
const STUBBED_COMMIT = "4e631128d728";
const SHORT_COMMIT = "4e63112";

/**
 * Matches the backend call on its exact pathname: Vite serves the frontend
 * module `src/api/version.ts` from a URL that shares the "/api/version" prefix.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the short build commit next to the version in the footer", async ({
    page,
  }) => {
    await page.route(isVersionApiUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: STUBBED_VERSION, commit: STUBBED_COMMIT }),
      }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("app-version")).toHaveText(` v${STUBBED_VERSION}`);
    await expect(page.getByTestId("app-commit")).toHaveText(` (${SHORT_COMMIT})`);
    await expect(footer).toHaveText(`Task Notes v${STUBBED_VERSION} (${SHORT_COMMIT})`);
  });

  test("renders the footer without a commit when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(isVersionApiUrl, (route) => route.abort("connectionrefused"));

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
