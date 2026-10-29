import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version (criterion 1)", async ({
    page,
  }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "2.0.0-e2e", commit: "4f2a9c1e8b7d" }),
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v2.0.0-e2e (4f2a9c1)");
    await expect(page.getByTestId("app-footer-commit")).toBeVisible();
  });

  test("shows the version alone when the response carries no commit (edge case)", async ({
    page,
  }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "2.0.0-e2e" }),
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v2.0.0-e2e");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
