import { test, expect, type Page } from "@playwright/test";

// The version request is stubbed so the result does not depend on whether the run's
// backend has BUILD_COMMIT set. The page and the API are on different origins, so the
// stub carries the CORS header a real backend response would.
async function stubVersion(page: Page, body: { version: string; commit: string }) {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the short build commit next to the version in the landing page footer", async ({
    page,
  }) => {
    await stubVersion(page, { version: "0.1.0", commit: "0123456789ab" });
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveText("(0123456)");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (0123456)");
  });

  test("shows the version alone when the backend reports an unknown commit", async ({ page }) => {
    await stubVersion(page, { version: "0.1.0", commit: "unknown" });
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
