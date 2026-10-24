import { test, expect, type Request, type Response } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact pathname.
 *
 * A glob such as "**\/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that ends the same way, so a glob
 * would also catch (and abort) the module fetch and break the whole page.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

function isVersionApiResponse(response: Response): boolean {
  return isVersionApiUrl(new URL(response.url()));
}

function isVersionApiRequest(request: Request): boolean {
  return isVersionApiUrl(new URL(request.url()));
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend's /api/version response carried", async ({ page }) => {
    const versionResponse = page.waitForResponse(isVersionApiResponse);
    await page.goto("/");

    const body = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${body.version}`);
  });

  test("shows the app name alone when /api/version is unreachable", async ({ page }) => {
    await page.route(isVersionApiUrl, (route) => route.abort());

    const failedRequest = page.waitForEvent("requestfailed", isVersionApiRequest);
    await page.goto("/");
    await failedRequest;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
