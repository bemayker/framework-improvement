import { test, expect, type Page, type Response } from "@playwright/test";

// The footer shows the backend's version (TEST-08), so the expected value is
// whatever the page's own GET /api/version call reported, not a file on disk.
function isVersionApiResponse(response: Response): boolean {
  return new URL(response.url()).pathname === "/api/version";
}

async function openAndReadReportedVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response) => isVersionApiResponse(response) && response.ok(),
  );

  await page.goto("/");

  const { version } = (await (await versionResponse).json()) as { version: string };
  return version;
}

test.describe("TEST-04 page footer", () => {
  test("shows a footer with the app name and the version the backend reported", async ({
    page,
  }) => {
    const version = await openAndReadReportedVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    const version = await openAndReadReportedVersion(page);

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
    const version = await openAndReadReportedVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(version);
  });
});
