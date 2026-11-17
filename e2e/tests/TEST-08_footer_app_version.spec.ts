import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiRequest(request: Request): boolean {
  return new URL(request.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version GET /api/version returns in the landing page footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };
    const footer = page.getByTestId("app-footer");

    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(`v${version}`);
    await expect(page.getByTestId("app-footer-version")).toHaveText(` v${version}`);
  });

  test("renders only the app name when GET /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort(),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
