import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Opens the landing page and returns the version its own `GET /api/version`
 * response carried.
 *
 * The footer shows the backend's version rather than the frontend bundle's
 * (TEST-08), and the two legitimately differ, so `frontend/package.json` is no
 * longer the expected value. Matching on the exact pathname keeps the module
 * fetch for `src/api/version.ts`, whose URL contains the same substring, out of
 * the match.
 */
async function openLandingPageAndReadVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response) =>
      new URL(response.request().url()).pathname === VERSION_PATH &&
      response.ok(),
  );

  await page.goto("/");

  const { version } = (await (await versionResponse).json()) as {
    version: string;
  };

  return version;
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version reported by GET /api/version", async ({
    page,
  }) => {
    const version = await openLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    const version = await openLandingPageAndReadVersion(page);

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
    const version = await openLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
