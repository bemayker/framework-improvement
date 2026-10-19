import { test, expect, type Page } from "@playwright/test";

// The dev stack defaults BUILD_COMMIT to "unknown", so the version response is
// fulfilled here to make the commit deterministic. The API lives on another
// origin than the page, hence the CORS header on the fulfilled response.
async function fulfilVersion(page: Page, body: { version: string; commit: string }) {
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
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "abc1234def56" });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0 (abc1234)");
    await expect(page.getByTestId("app-footer-commit")).toHaveText(" (abc1234)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "unknown" });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
