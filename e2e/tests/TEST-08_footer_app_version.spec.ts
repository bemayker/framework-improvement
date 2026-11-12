import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from GET /api/version in the landing page footer", async ({
    page,
  }) => {
    const backendVersion = readBackendVersion();

    await page.goto("/");

    await expect(page.getByTestId("app-version")).toContainText(backendVersion);
    await expect(page.getByTestId("app-footer")).toContainText(`Task Notes v${backendVersion}`);
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/i);
  });
});
