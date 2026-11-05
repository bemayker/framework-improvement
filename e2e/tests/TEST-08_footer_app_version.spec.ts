import { test, expect, type Response } from "@playwright/test";

const VERSION_PATH = "/api/version";
const REPORTED_VERSION = "9.9.9-e2e";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiResponse(response: Response): boolean {
  return new URL(response.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer shows the app version", () => {
  test("footer shows the version the backend reported", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiResponse(response) && response.ok(),
    );

    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("footer shows the backend's version, not the frontend's own", async ({ page }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify({ version: REPORTED_VERSION }),
        }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${REPORTED_VERSION}`);
    await expect(footer).not.toContainText("v0.0.0");
  });

  test("footer reads exactly Task Notes when the version request fails", async ({ page }) => {
    const failedVersionRequest = page.waitForEvent(
      "requestfailed",
      (request) => new URL(request.url()).pathname === VERSION_PATH,
    );
    await page.route((url) => url.pathname === VERSION_PATH, (route) => route.abort());

    await page.goto("/");

    await failedVersionRequest;
    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
