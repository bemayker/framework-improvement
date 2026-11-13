import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";
const FIXED_VERSION = "0.1.0";

/**
 * Fulfils the version call with a fixed body, because no CI workflow sets
 * BUILD_COMMIT and the live backend would answer `unknown`. The match is on the
 * exact pathname and the GET method: a substring check would also catch the
 * module fetch, since Vite serves `src/api/version.ts` from a URL containing
 * the same text.
 */
async function fulfilVersionApi(page: Page, commit: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) => {
      if (route.request().method() !== "GET") {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: FIXED_VERSION, commit }),
      });
    },
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    await fulfilVersionApi(page, "a1b2c3d4e5f6");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${FIXED_VERSION} (a1b2c3d)`);
    await expect(page.getByTestId("app-version")).toHaveText(`v${FIXED_VERSION}`);
    await expect(page.getByTestId("app-commit")).toHaveText("a1b2c3d");
  });

  test("shows the version alone when the backend reports no build commit", async ({ page }) => {
    await fulfilVersionApi(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${FIXED_VERSION}`);
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown|\(|\)/);
  });
});
