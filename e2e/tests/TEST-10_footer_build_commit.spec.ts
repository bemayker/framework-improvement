import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

// Exact pathname match: Vite serves the module src/api/version.ts from a URL that
// also contains "/api/version", and stubbing that would break the page itself.
// Stubbing the response keeps the spec independent of the stack's BUILD_COMMIT.
async function stubVersion(page: import("@playwright/test").Page, commit: string) {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) => route.fulfill({ json: { version: "0.1.0", commit } }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the short build commit next to the version in the landing page footer", async ({
    page,
  }) => {
    await stubVersion(page, "a1b2c3d4e5f6");

    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("v0.1.0");
    const commit = page.getByTestId("app-commit");
    await expect(commit).toContainText("a1b2c3d");
    await expect(commit).not.toContainText("a1b2c3d4");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (a1b2c3d)");
  });

  test("shows the version alone when the backend reports an unknown commit", async ({ page }) => {
    await stubVersion(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(footer).not.toContainText("unknown");
    await expect(footer).not.toContainText("undefined");
  });
});
