import { test, expect, type Page } from "@playwright/test";

// The footer's version is the backend's, so the expected value is the one in
// the page's own /api/version response rather than frontend/package.json.
async function gotoLandingPage(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/version" && response.ok(),
  );
  await page.goto("/");
  const { version } = (await (await versionResponse).json()) as { version: string };
  return version;
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version from /api/version", async ({
    page,
  }) => {
    const version = await gotoLandingPage(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    const version = await gotoLandingPage(page);

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
    const version = await gotoLandingPage(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
