import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const VERSION = "0.1.0";

// The CI stack runs with BUILD_COMMIT unset, so the real backend reports
// "unknown"; fulfilling the route keeps the commit deterministic.
async function fulfilVersion(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ version: VERSION, commit }),
    }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfilVersion(page, "9a6bfd7c3e1f");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${VERSION} (9a6bfd7)`);
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await fulfilVersion(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${VERSION}`);
    await expect(footer).not.toContainText(/undefined|null|unknown|\(\)/);
  });
});
