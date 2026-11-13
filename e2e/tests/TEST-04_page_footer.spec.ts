import { test, expect } from "@playwright/test";

// The exact version value is TEST-08's spec (it comes from the backend at
// runtime); this spec only checks that the footer shows a version element.
test.describe("TEST-04 page footer", () => {
  test("renders the footer with the app name and the backend version", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toBeVisible();
  });

  test("exposes the footer as a contentinfo landmark", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("contentinfo")).toContainText("Task Notes");
    await expect(page.getByRole("contentinfo").getByTestId("app-version")).toBeVisible();
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
    await expect(page.getByTestId("app-version")).toBeVisible();
  });
});
