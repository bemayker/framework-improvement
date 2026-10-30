import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the backend version served at runtime in the footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveText(`v${backendVersion}`);
    // The footer also carries the build commit (TEST-10), so only the prefix is exact here.
    await expect(footer).toContainText(`Task Notes v${backendVersion}`);
  });

  test("renders the app name alone when the version request is aborted", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    // Registered before navigation so the assertions below only run once the
    // rejection path has actually been taken, not while the request is in flight.
    const versionRequestFailed = page.waitForEvent("requestfailed", (request) =>
      request.url().endsWith("/api/version"),
    );

    await page.goto("/");
    await versionRequestFailed;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
