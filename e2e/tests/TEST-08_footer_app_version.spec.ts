import { test, expect, type Page, type Response } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact pathname. A substring check is
 * not enough: Vite serves the frontend module `src/api/version.ts` from a URL
 * that contains the same substring.
 */
function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

/** Opens the landing page and returns the page's own `/api/version` response. */
async function openLandingPageAndGetVersionResponse(page: Page): Promise<Response> {
  const versionResponse = page.waitForResponse((response) =>
    isVersionApiUrl(response.url()),
  );

  await page.goto("/");

  return versionResponse;
}

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the version the backend reports in the footer", async ({ page }) => {
    const response = await openLandingPageAndGetVersionResponse(page);
    expect(response.ok()).toBe(true);
    const { version, commit } = (await response.json()) as {
      version: string;
      commit?: string;
    };
    expect(version).not.toBe("");

    // TEST-10 appends the short commit when the backend reports a real one; the
    // default stack reports `unknown`, which shows the version alone.
    const hasUsableCommit =
      typeof commit === "string" && commit.trim() !== "" && commit !== "unknown";
    const expectedText = hasUsableCommit
      ? `Task Notes v${version} (${commit.slice(0, 7)})`
      : `Task Notes v${version}`;

    await expect(page.getByTestId("app-footer")).toHaveText(expectedText);
  });

  test("shows the backend's version, ignoring extra fields and the frontend package version", async ({
    page,
  }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify({ version: "9.9.9-backend", commit: "abc1234" }),
        }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v9.9.9-backend (abc1234)");
    // frontend/package.json declares 0.0.0, which must not be what the footer shows.
    await expect(footer).not.toContainText("0.0.0");
  });

  test("renders only the app name when the version endpoint is unreachable", async ({
    page,
  }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort("connectionrefused"),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    // Auto-retrying exact match: also settles once the failed fetch has resolved.
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("null");
  });
});
