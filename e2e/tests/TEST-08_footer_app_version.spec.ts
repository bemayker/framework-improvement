import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the page's own /api/version response carried", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.request().method() === "GET",
    );
    await page.goto("/");

    const { version, commit } = (await (await versionResponse).json()) as {
      version: string;
      commit: string;
    };

    // The footer appends the short commit only when the backend reports a real one.
    const expectedText =
      commit && commit !== "unknown"
        ? `Task Notes v${version} (${commit.slice(0, 7)})`
        : `Task Notes v${version}`;
    await expect(page.getByTestId("app-footer")).toHaveText(expectedText);
  });

  test("shows exactly the app name when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
