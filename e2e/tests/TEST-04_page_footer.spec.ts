import { test, expect, type Page } from "@playwright/test";

// The footer's version comes from the backend's GET /api/version (TEST-08), so the
// expected value is the body of the response the page itself received.
async function openLandingPageAndReadBackendVersion(page: Page): Promise<string> {
  const responsePromise = page.waitForResponse("**/api/version");
  await page.goto("/");
  const response = await responsePromise;
  const body = (await response.json()) as { version: string };
  return body.version;
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version from GET /api/version", async ({
    page,
  }) => {
    const version = await openLandingPageAndReadBackendVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    const version = await openLandingPageAndReadBackendVersion(page);

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
    const version = await openLandingPageAndReadBackendVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
