import { test, expect, type Page } from "@playwright/test";

// The CI and default local backend run without BUILD_COMMIT, so they answer commit "unknown".
// The response is therefore fulfilled here. The page (:5183) calls the backend (:8010) cross-origin,
// so the canned response carries the CORS header a real backend response would.
async function fulfilVersion(page: Page, body: { version: string; commit: string }) {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the short build commit next to the version in the footer", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "abcdef123456" });

    await page.goto("/");

    await expect(page.getByTestId("app-commit")).toHaveText(" (abcdef1)");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (abcdef1)");
  });

  test("shows the version alone in the footer when the backend reports an unknown commit", async ({
    page,
  }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "unknown" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
