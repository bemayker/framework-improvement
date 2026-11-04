import { test, expect } from "@playwright/test";

// BUILD_COMMIT is unset locally and in CI, so the real backend always answers
// commit "unknown". The response is stubbed to give the footer a real commit.
test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "0.1.0", commit: "0515c74d9e2f" }),
      }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0 (0515c74)");
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(0515c74)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version: "0.1.0", commit: "unknown" }),
      }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText("unknown");
  });
});
