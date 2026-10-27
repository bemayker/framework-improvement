import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Fulfils the backend version call with a fixed body.
 *
 * The response is fulfilled rather than read from the real backend because the
 * commit is "unknown" wherever BUILD_COMMIT is unset, which would make the
 * success path unobservable. The match is on the exact pathname: a substring
 * check on "/api/version" would also catch the Vite module `src/api/version.ts`.
 */
async function fulfilVersion(page: Page, body: { version: string; commit: string }): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      });
    },
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "a1b2c3d4e5f6" });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0 (a1b2c3d)");
    await expect(page.getByTestId("app-footer-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(a1b2c3d)");
    await expect(footer).not.toContainText("a1b2c3d4");
  });

  test("leaves the commit out when the backend reports unknown", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "unknown" });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
