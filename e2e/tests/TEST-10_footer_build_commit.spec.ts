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

/**
 * Lets the real backend answer, then rewrites only the commit so the test is
 * deterministic (BUILD_COMMIT is unset in the local and CI stacks, which would
 * always yield "unknown"). The real response keeps its CORS headers.
 */
async function overrideBackendCommit(page: Page, commit: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { version: string; commit: string };
      await route.fulfill({ response, json: { ...body, commit } });
    },
  );
}

/** Opens the landing page and returns the version the (rewritten) response carried. */
async function openLandingPageAndReadVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response) => isVersionApiResponse(response) && response.ok(),
  );

  await page.goto("/");

  const body = (await (await versionResponse).json()) as { version: string };
  return body.version;
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version in the landing page footer", async ({
    page,
  }) => {
    await overrideBackendCommit(page, "abcdef123456");

    const version = await openLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(abcdef1)");
    await expect(footer).toContainText(`Task Notes v${version} (abcdef1)`);
  });

  test("shows the version alone when the backend reports the unknown commit", async ({
    page,
  }) => {
    await overrideBackendCommit(page, "unknown");

    const version = await openLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${version}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown|\(/);
  });
});
