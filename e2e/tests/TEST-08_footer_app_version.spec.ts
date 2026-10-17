import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring, so a
 * substring matcher would catch (or abort) the module load and blank the page.
 */
function isVersionApiRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend returned in the footer", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version}`);
  });

  test("shows only the app name when the version request fails", async ({ page }) => {
    await page.route((url) => url.pathname === VERSION_PATH, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(footer).toBeVisible();
    // Exact text: no version, no trailing " v", no undefined, null or unknown.
    await expect(footer).toHaveText("Task Notes");
  });
});
