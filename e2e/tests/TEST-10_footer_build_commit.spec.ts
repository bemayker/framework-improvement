import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * TEST-10: the footer shows the first 7 characters of the build commit.
 *
 * The stack's real backend reports commit "unknown" until a build sets
 * BUILD_COMMIT, so both specs fulfil GET /api/version through page.route. The
 * route is registered before page.goto so the page's first request is caught.
 */
const VERSION_PATH = "/api/version";
const VERSION = "0.1.0";
const FULL_COMMIT = "0123456789ab";
const SHORT_COMMIT = "0123456";

async function fulfilVersion(page: Page, commit: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        // The backend answers cross-origin from the frontend's port.
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: VERSION, commit }),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    await fulfilVersion(page, FULL_COMMIT);

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${VERSION} (${SHORT_COMMIT})`);
    await expect(page.getByTestId("app-commit")).toHaveText(`(${SHORT_COMMIT})`);
    await expect(page.getByTestId("app-version")).toHaveText(`v${VERSION}`);
    await expect(footer).not.toContainText(FULL_COMMIT);
  });

  test("shows the version alone when the backend reports an unknown commit", async ({
    page,
  }) => {
    await fulfilVersion(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    // Wait on the version first: the absence assertions below pass instantly.
    await expect(page.getByTestId("app-version")).toHaveText(`v${VERSION}`);
    await expect(footer).toHaveText(`Task Notes v${VERSION}`);
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
