import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

function readVersion(relativePath: string, pattern: RegExp): string {
  const content = readFileSync(path.resolve(__dirname, relativePath), "utf-8");
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`No version found in ${relativePath}`);
  }
  return match[1];
}

const backendVersion = readVersion("../../backend/pyproject.toml", /^version\s*=\s*"([^"]+)"/m);
const frontendVersion = readVersion("../../frontend/package.json", /"version"\s*:\s*"([^"]+)"/);

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname === VERSION_PATH;
}

async function openLandingPageAfterVersionResponse(page: Page): Promise<void> {
  const versionResponse = page.waitForResponse(
    (response) => isVersionApiRequest(response.request()) && response.ok(),
  );
  await page.goto("/");
  await versionResponse;
}

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the version served by the backend, not the frontend package version", async ({
    page,
  }) => {
    await openLandingPageAfterVersionResponse(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-version")).toHaveText(`v${backendVersion}`);

    if (frontendVersion !== backendVersion) {
      await expect(footer).not.toContainText(`v${frontendVersion}`);
    }
  });

  test("shows the app name alone when the version request is unreachable", async ({ page }) => {
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort(),
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
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("null");
    await expect(footer).not.toContainText("unknown");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
