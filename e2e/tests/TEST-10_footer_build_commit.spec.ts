import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the commit from GET /api/version next to the version", async ({
    page,
  }) => {
    await page.route(`**${VERSION_PATH}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "0.1.0", commit: "0123456789ab" }),
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (0123456)");
  });

  test("shows the version alone when GET /api/version reports the unknown commit", async ({
    page,
  }) => {
    await page.route(`**${VERSION_PATH}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "0.1.0", commit: "unknown" }),
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
  });
});
