import { test, expect } from "@playwright/test";

test.describe("FEAT-6 stamp endpoint and footer", () => {
  test("shows 'stamp: ok' in the footer once the backend answers", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer-stamp")).toHaveText("stamp: ok");
  });

  test("shows 'stamp: ok' in the footer on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const stamp = page.getByTestId("app-footer-stamp");
    await expect(stamp).toBeVisible();
    await expect(stamp).toHaveText("stamp: ok");
  });
});
