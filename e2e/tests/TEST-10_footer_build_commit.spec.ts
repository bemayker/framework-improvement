import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact pathname. A substring check is
 * not enough: Vite serves the frontend module `src/api/version.ts` from a URL
 * that contains the same substring.
 */
function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

/** Stubs the backend's version response so the commit is deterministic. */
async function stubVersionResponse(page: Page, body: object): Promise<void> {
  await page.route(
    (url) => isVersionApiUrl(url.toString()),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(body),
      }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the version followed by the first 7 characters of the commit", async ({
    page,
  }) => {
    await stubVersionResponse(page, { version: "1.2.3", commit: "0123456789ab" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3 (0123456)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await stubVersionResponse(page, { version: "1.2.3", commit: "unknown" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v1.2.3");
  });

  test("renders only the app name when the version request is aborted", async ({
    page,
  }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort("connectionrefused"),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
