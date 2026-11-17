import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

test.describe("TEST-08 footer app version", () => {
  test("footer shows the version the backend reports", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${readBackendVersion()}`);
  });

  test("footer shows only the app name when the version endpoint fails", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
    );
    const versionResponse = page.waitForResponse("**/api/version");
    await page.goto("/");
    await versionResponse;

    await expect(page.getByTestId("app-footer")).toBeVisible();
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
