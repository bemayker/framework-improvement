import { test, expect } from "@playwright/test";

test.describe("TEST-10 footer shows the build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "0.1.0", commit: "abc1234def56" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (abc1234)");
  });

  test("footer shows the version alone when the commit is unknown", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "0.1.0", commit: "unknown" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
  });

  test("footer reads exactly Task Notes when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
