import { test, expect } from "@playwright/test";
import { readBackendVersion, readFrontendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();
const frontendVersion = readFrontendVersion();

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the backend's version from backend/pyproject.toml, not the frontend's", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText(`Task Notes v${backendVersion}`);
    if (frontendVersion !== backendVersion) {
      await expect(footer).not.toContainText(`v${frontendVersion}`);
    }
  });

  test("shows exactly 'Task Notes' when the version request is aborted", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
