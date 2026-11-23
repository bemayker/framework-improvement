import { test, expect, type Page } from "@playwright/test";

const VERSION = "0.1.0";

// The E2E backend runs with BUILD_COMMIT unset and would answer "unknown", so the
// response is fulfilled here to make the commit deterministic.
async function mockVersion(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: VERSION, commit }),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({ page }) => {
    await mockVersion(page, "0123456789ab");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${VERSION} (0123456)`);
  });

  test("shows the version alone when the backend reports the unknown commit", async ({ page }) => {
    await mockVersion(page, "unknown");
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${VERSION}`);
    await expect(footer).not.toContainText("unknown");
  });
});
