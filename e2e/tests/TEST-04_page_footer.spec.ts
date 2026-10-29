import { test, expect } from "@playwright/test";

// The footer no longer shows the frontend package version: since TEST-08 it
// shows the version the backend reports, so these specs pin that response.
const BACKEND_VERSION = "1.2.3-e2e";

test.describe("TEST-04 page footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: BACKEND_VERSION }),
      }),
    );
  });

  test("shows a footer with the app name and the version the backend reports", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(BACKEND_VERSION);
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("contentinfo")).toContainText(BACKEND_VERSION);
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
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(BACKEND_VERSION);
  });
});
