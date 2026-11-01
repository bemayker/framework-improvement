import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";
const BACKEND_VERSION = "0.1.0";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

// The stack runs with BUILD_COMMIT unset, so the real backend reports
// "unknown"; the commit must be stubbed to see one.
async function stubBackendVersion(page: Page, commit: string): Promise<void> {
  await page.route(
    (url) => isVersionApiUrl(url.toString()),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        // The page and the API are different origins, so the browser enforces CORS
        // on a fulfilled response exactly as it does on a real one.
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: BACKEND_VERSION, commit }),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await stubBackendVersion(page, "0123456789ab");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer.getByTestId("app-footer-commit")).toHaveText("(0123456)");
    await expect(footer).toHaveText(`Task Notes v${BACKEND_VERSION} (0123456)`);
  });

  test("shows the version alone when the backend reports an unknown commit", async ({ page }) => {
    await stubBackendVersion(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${BACKEND_VERSION}`);
    await expect(footer.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/unknown|undefined|null/i);
  });
});
