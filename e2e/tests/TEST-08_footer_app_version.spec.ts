import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version: frontendPackageVersion } = JSON.parse(
  readFileSync(frontendPackageJsonPath, "utf-8"),
) as { version: string };

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the browser received from /api/version, not the frontend package version", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const body = (await (await versionResponse).json()) as { version: string };
    const footer = page.getByTestId("app-footer");

    await expect(page.getByTestId("app-footer-version")).toBeVisible();
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${body.version}`);
    await expect(footer).toContainText(`Task Notes v${body.version}`);
    expect(body.version).not.toBe("unknown");
    expect(body.version).not.toBe(frontendPackageVersion);
    await expect(footer).not.toContainText(`v${frontendPackageVersion}`);
  });

  test("reads Task Notes alone when /api/version is unreachable", async ({ page }) => {
    let aborted = false;
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      async (route) => {
        aborted = true;
        await route.abort();
      },
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect.poll(() => aborted).toBe(true);
    await expect(footer).toHaveText("Task NotesBuild note");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
