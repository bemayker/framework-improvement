import { test, expect, type Page, type Response } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring, so a
 * substring matcher catches the module fetch instead of the API call.
 */
function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

/** Opens the landing page and returns the version the backend's own response carried. */
async function openLandingPageAndReadBackendVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response: Response) => isVersionApiUrl(response.url()) && response.ok(),
  );

  await page.goto("/");

  const body = (await (await versionResponse).json()) as { version: string };
  return body.version;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend reports in the landing page footer", async ({ page }) => {
    const backendVersion = await openLandingPageAndReadBackendVersion(page);

    // Whatever the backend answered is what the footer shows, so a frontend
    // bundle declaring any other version cannot change the displayed value.
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the app name alone when the version endpoint is unreachable", async ({ page }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort(),
    );

    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
