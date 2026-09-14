import { test, expect, type Page } from "@playwright/test";

/**
 * The backend route the footer reads its version from, compared as a WHOLE
 * pathname.
 *
 * A substring or glob match is not merely loose here, it is wrong: under the
 * Vite dev server — which is what CI serves — the browser also requests the
 * source module `/src/api/version.ts`, and that path contains "/api/version".
 * A substring matcher therefore resolves on the JavaScript module, and
 * `response.json()` parses `import { API_BASE_URL } ...` and throws. Comparing
 * the whole pathname accepts the real API call, cross-origin
 * (http://localhost:8010/api/version) or same-origin, and rejects the module.
 */
const VERSION_PATHNAME = "/api/version";

function isVersionUrl(url: URL): boolean {
  return url.pathname === VERSION_PATHNAME;
}

/**
 * Opens the landing page and returns the version the browser itself received
 * from GET /api/version. TEST-08 moved the footer's version from the frontend
 * package metadata to the backend's response, so the expected value is read
 * from the page's own traffic rather than from a file on disk.
 */
async function gotoLandingPageAndReadVersion(page: Page): Promise<string> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        isVersionUrl(new URL(candidate.url())) &&
        candidate.request().method() === "GET",
    ),
    page.goto("/"),
  ]);

  const body = (await response.json()) as { version: string };
  return body.version;
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version from GET /api/version", async ({
    page,
  }) => {
    const version = await gotoLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    const version = await gotoLandingPageAndReadVersion(page);

    await expect(page.getByRole("contentinfo")).toContainText(version);
  });

  test("leaves the existing landing-page heading and subtitle unchanged", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("landing-title")).toHaveText("Task Notes");
    await expect(page.getByRole("heading", { name: "Task Notes" })).toBeVisible();
    await expect(
      page.getByText("A minimal task-notes app for keeping track of what needs doing."),
    ).toBeVisible();
  });

  test("keeps the footer visible on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const version = await gotoLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
