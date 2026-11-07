import { test, expect } from "@playwright/test";

test.describe("TEST-08 footer shows the backend version", () => {
  test("footer shows the version the page's own GET /api/version returned", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.request().method() === "GET",
    );
    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-footer-version")).toContainText(version);
    await expect(page.getByTestId("app-footer")).toContainText(`Task Notes v${version}`);
  });

  test("footer reads exactly Task Notes when the version request is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
