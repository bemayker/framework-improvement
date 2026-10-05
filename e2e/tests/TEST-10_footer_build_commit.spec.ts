import { test, expect } from "@playwright/test";

const VERSION_PATH = "**/api/version";

// Routes the backend's version endpoint so the commit value is deterministic
// (the live backend reports "unknown" unless BUILD_COMMIT was set at build time).
async function routeVersion(
  page: import("@playwright/test").Page,
  body: { version: string; commit: string },
): Promise<void> {
  await page.route(VERSION_PATH, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the commit after the version", async ({ page }) => {
    await routeVersion(page, { version: "9.9.9", commit: "abc123def456" });
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v9.9.9 · abc123d");
    await expect(page.getByTestId("app-footer-commit")).toHaveText("abc123d");
    await expect(footer).not.toContainText("abc123def456");
  });

  test("shows the version alone when the commit is 'unknown'", async ({ page }) => {
    await routeVersion(page, { version: "9.9.9", commit: "unknown" });
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v9.9.9");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText("unknown");
  });
});
