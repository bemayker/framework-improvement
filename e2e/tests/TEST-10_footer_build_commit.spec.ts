import { test, expect, type Page } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

// The E2E stack runs with BUILD_COMMIT blank, so the real backend answers "unknown".
// Each spec fetches the real response in the browser and swaps in the commit it needs.
async function serveCommit(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, commit } });
  });
}

test.describe("TEST-10 footer build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await serveCommit(page, "abcdef123456");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion} (abcdef1)`);
    await expect(page.getByTestId("app-commit")).toBeVisible();
  });

  test("footer shows the version alone when the commit is unknown", async ({ page }) => {
    await serveCommit(page, "unknown");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });

  test("footer renders the app name alone when the version request fails", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
