import { test, expect } from "@playwright/test";

// /api/version is stubbed so the commit is deterministic: the E2E stack runs without
// BUILD_COMMIT, so the real endpoint reports the "unknown" commit sentinel.
test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "1.2.3", commit: "0123456789ab" } }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes v1.2.3 (0123456)");
    await expect(page.getByTestId("app-footer-commit")).toHaveText("0123456");
  });

  test("shows the version alone when the backend reports the unknown commit", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "1.2.3", commit: "unknown" } }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v1.2.3");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });

  test("shows no commit and no undefined when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
