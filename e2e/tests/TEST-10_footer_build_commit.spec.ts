import { test, expect } from "@playwright/test";

const isVersionRequest = (url: string) => new URL(url).pathname === "/api/version";

test.describe("TEST-10 footer build commit", () => {
  test("footer shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    // The body is stubbed so the expected text holds whatever BUILD_COMMIT the environment sets.
    await page.route(
      (url) => isVersionRequest(url.toString()),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ version: "0.1.0", commit: "abc1234def56" }),
        }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-commit")).toHaveText(" (abc1234)");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (abc1234)");
  });

  test("footer shows no commit when the version endpoint is unreachable", async ({ page }) => {
    await page.route(
      (url) => isVersionRequest(url.toString()),
      (route) => route.abort(),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
