import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";
const MOCK_VERSION = "9.9.9";

/**
 * Matches the backend version call on its exact pathname.
 *
 * A substring or glob match on "/api/version" is not enough: Vite serves the
 * frontend module `src/api/version.ts` from a URL that contains the same
 * substring, so fulfilling it would replace the module instead of the API call.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the 7-character commit next to the version", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: MOCK_VERSION, commit: "abcdef123456" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${MOCK_VERSION} (abcdef1)`,
    );
    // The leading space is asserted on the raw text, which toHaveText's
    // whitespace normalization would hide.
    await expect(page.getByTestId("app-commit")).toHaveJSProperty(
      "textContent",
      " (abcdef1)",
    );
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: MOCK_VERSION, commit: "unknown" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${MOCK_VERSION}`,
    );
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
