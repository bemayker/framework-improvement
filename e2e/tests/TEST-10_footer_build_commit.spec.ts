import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";
const VERSION = "0.1.0";

// Exact pathname match: Vite serves src/api/version.ts from a URL that
// contains "/api/version" as a substring, so a substring matcher would
// fulfill the module fetch with JSON and break the page.
// The response is fulfilled because the local and CI backends build with
// BUILD_COMMIT unset, so they cannot be relied on to report a real commit.
async function fulfillVersion(page: Page, commit: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: VERSION, commit }),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfillVersion(page, "0123456789ab");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("app-footer-version")).toHaveText(` v${VERSION}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveText(" (0123456)");
    await expect(footer).toContainText(`Task Notes v${VERSION} (0123456)`);
    await expect(footer).not.toContainText("0123456789ab");
  });

  test("shows the version alone when the commit is the unknown sentinel", async ({ page }) => {
    await fulfillVersion(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${VERSION}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown|\(\)/);
  });
});
