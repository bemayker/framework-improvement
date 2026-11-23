import { test, expect, type Page, type Response } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend call on its exact path. A substring check is not enough:
 * Vite serves the frontend module `src/api/version.ts` from a URL that contains
 * the same text.
 */
function isVersionApiResponse(response: Response): boolean {
  return new URL(response.url()).pathname === VERSION_PATH;
}

/** Opens the landing page and returns the version the backend answered with. */
async function openLandingPageAndReadBackendVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response) => isVersionApiResponse(response) && response.ok(),
  );

  await page.goto("/");

  const body = (await (await versionResponse).json()) as { version: string };
  return body.version;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend reports on /api/version in the landing page footer", async ({
    page,
  }) => {
    const backendVersion = await openLandingPageAndReadBackendVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer-version")).toHaveText(
      `v${backendVersion}`,
    );
  });

  test("shows the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort("connectionrefused"),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
