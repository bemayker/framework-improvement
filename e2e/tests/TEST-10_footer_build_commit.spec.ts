import { test, expect } from "@playwright/test";

// The backend's version and commit are fulfilled here so the commit is deterministic:
// the E2E backend runs with BUILD_COMMIT unset, so its real commit is "unknown".
test.describe("TEST-10 footer build commit", () => {
  test("shows the short build commit next to the version", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "1.2.3", commit: "abcdef123456" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3 (abcdef1)");
  });

  test("shows the version alone when the backend reports the commit as unknown", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "1.2.3", commit: "unknown" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3");
  });
});
