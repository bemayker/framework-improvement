import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend call on its exact path and method. A substring check is
 * not enough: Vite serves the frontend module `src/api/version.ts` from a URL
 * that contains the same text, so a substring matcher catches the module fetch.
 */
function isVersionApiRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend reports at GET /api/version", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const body = (await (await versionResponse).json()) as { version: string };
    expect(typeof body.version).toBe("string");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText(`Task Notes v${body.version}`);
    await expect(page.getByTestId("app-version")).toHaveText(`v${body.version}`);
  });

  test("shows the app name without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort("connectionrefused"),
    );
    const failedRequest = page.waitForEvent(
      "requestfailed",
      (request) => isVersionApiRequest(request),
    );

    await page.goto("/");
    await failedRequest;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
