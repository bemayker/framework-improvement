import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the backend version in the footer on the landing page", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText(`v${readBackendVersion()}`);
    await expect(page.getByTestId("app-version")).toHaveText(` v${readBackendVersion()}`);
  });

  test("shows a version served at runtime that exists nowhere in the frontend", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: "9.9.9-e2e" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toContainText("v9.9.9-e2e");
  });

  test("shows the app name alone when the version request cannot be reached", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
