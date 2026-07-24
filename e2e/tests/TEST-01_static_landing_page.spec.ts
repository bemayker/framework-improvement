import { test, expect } from "@playwright/test";

test.describe("TEST-01 static landing page", () => {
  test("shows the landing page with the title 'Task Notes'", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("landing-page")).toBeVisible();
    await expect(page.getByTestId("landing-title")).toHaveText("Task Notes");
    await expect(page.getByRole("heading", { name: "Task Notes" })).toBeVisible();
  });

  test("shows the title on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByTestId("landing-title")).toHaveText("Task Notes");
  });
});
