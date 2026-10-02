import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// The API may live on another origin than the page, so a fulfilled response
// must carry the CORS header the real backend would send.
async function fulfillVersion(page: Page, body: { version: string; commit: string }) {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(body),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit beside the version", async ({
    page,
  }) => {
    await fulfillVersion(page, { version: "1.2.3", commit: "abcdef1234567890" });
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("1.2.3");
    await expect(page.getByTestId("app-commit")).toHaveText("abcdef1");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3 (abcdef1)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await fulfillVersion(page, { version: "1.2.3", commit: "unknown" });
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("1.2.3");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3");
  });
});
