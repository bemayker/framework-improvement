import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";
const REPORTED_VERSION = "0.1.0";

/**
 * Fulfils the backend version call with a fixed body.
 *
 * The route matches the exact pathname: a substring check on "/api/version"
 * would also catch the Vite module `src/api/version.ts`. A fulfilled response
 * is used because CI runs with BUILD_COMMIT unset, so the live backend would
 * only ever report `unknown`.
 */
async function fulfilVersion(page: Page, body: { version: string; commit: string }) {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({
    page,
  }) => {
    await fulfilVersion(page, { version: REPORTED_VERSION, commit: "3f2a9c1d4e5b" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${REPORTED_VERSION} (3f2a9c1)`,
    );
  });

  test("footer leaves the version alone when the commit is unknown", async ({ page }) => {
    await fulfilVersion(page, { version: REPORTED_VERSION, commit: "unknown" });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${REPORTED_VERSION}`);
    await expect(footer).not.toContainText("(");
    await expect(footer).not.toContainText("unknown");
  });
});
