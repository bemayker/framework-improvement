import { test, expect } from "@playwright/test";

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "0.1.0", commit: "abcdef123456" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (abcdef1)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "0.1.0", commit: "unknown" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
  });
});
