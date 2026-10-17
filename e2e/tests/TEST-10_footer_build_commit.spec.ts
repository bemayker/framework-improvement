import { test, expect } from "@playwright/test";

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the served commit next to the version", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "9.9.9-e2e", commit: "abcdef123456" } }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-version")).toHaveText(" v9.9.9-e2e");
    await expect(page.getByTestId("app-commit")).toHaveText(" (abcdef1)");
    await expect(footer).toHaveText("Task Notes v9.9.9-e2e (abcdef1)");
  });

  test("shows the version alone when the served commit is unknown", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "9.9.9-e2e", commit: "unknown" } }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-version")).toHaveText(" v9.9.9-e2e");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(footer).toHaveText("Task Notes v9.9.9-e2e");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
