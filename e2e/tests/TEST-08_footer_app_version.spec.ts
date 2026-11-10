import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version reported by the backend, not the frontend bundle's", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows exactly the app name when the version request is aborted", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
