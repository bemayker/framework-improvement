import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version reported by GET /api/version in the landing page footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("renders the footer with the app name and the backend version", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("renders exactly the app name when GET /api/version fails", async ({ page }) => {
    await page.route(`**${VERSION_PATH}`, (route) => route.abort());
    const failedRequest = page.waitForEvent(
      "requestfailed",
      (request) => new URL(request.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    await failedRequest;

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
