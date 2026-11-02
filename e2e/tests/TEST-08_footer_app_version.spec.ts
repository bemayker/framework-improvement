import { test, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches on the exact pathname: a substring match would also catch Vite
 * serving the client module `src/api/version.ts`.
 */
function isVersionApiRequest(request: Request): boolean {
  return request.method() === "GET" && new URL(request.url()).pathname === VERSION_PATH;
}

async function stubVersionResponse(page: Page, version: string): Promise<void> {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version }),
      }),
  );
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend's /api/version response carried", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as { version: string };
    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${version}`);
  });

  test("shows the backend's version when it differs from the frontend package's", async ({
    page,
  }) => {
    await stubVersionResponse(page, "9.9.9-backend");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9-backend");
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    await page.route((url) => url.pathname === VERSION_PATH, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
