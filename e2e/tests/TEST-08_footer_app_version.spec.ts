import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

test.describe("TEST-08 footer shows the app version", () => {
  test("footer reads the backend version fetched from /api/version", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${backendVersion}`);
  });

  test("footer reads exactly Task Notes when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
