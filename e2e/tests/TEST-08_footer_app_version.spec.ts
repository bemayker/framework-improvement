import { test, expect } from "@playwright/test";
import { backendVersion } from "../helpers/backendVersion";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact pathname.
 *
 * A substring or glob match on "/api/version" is not enough: Vite serves the
 * frontend module `src/api/version.ts` from a URL that contains the same
 * substring, so aborting it would break the page instead of the API call.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

/** Escapes regex metacharacters so a dotted version matches literally. */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version in the footer", async ({ page }) => {
    await page.goto("/");

    // Holds with or without a build commit: TEST-10 appends a commit span
    // when the backend has BUILD_COMMIT, which this test does not control.
    const version = backendVersion();
    // The leading space is asserted on the raw text, which toHaveText's
    // whitespace normalization would hide.
    await expect(page.getByTestId("app-version")).toHaveJSProperty(
      "textContent",
      ` v${version}`,
    );
    await expect(page.getByTestId("app-footer")).toHaveText(
      new RegExp(`^Task Notes v${escapeRegExp(version)}( \\([0-9a-f]{7}\\))?$`),
    );
  });

  test("shows exactly the app name when the version request fails", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) => route.abort());

    await page.goto("/");

    // The page itself rendered, so the abort did not hit the Vite module.
    await expect(page.getByTestId("landing-title")).toBeVisible();
    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
