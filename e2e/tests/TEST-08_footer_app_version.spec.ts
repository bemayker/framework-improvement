import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

test.describe("TEST-08 footer app version", () => {
  test("shows the backend's version in the footer on the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows only the app name when the version endpoint is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
