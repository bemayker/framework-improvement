import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the version the live backend reports (criterion 1)", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.status() === 200,
    );
    await page.goto("/");

    const { version, commit } = (await (await versionResponse).json()) as {
      version: string;
      commit?: string;
    };

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(new RegExp(`^Task Notes v${escapeRegExp(version)}`));
    if (commit) {
      await expect(footer).toContainText(`(${commit.slice(0, 7)})`);
    }
    await expect(page.getByTestId("app-footer-version")).toBeVisible();
  });

  test("shows the backend version rather than the frontend's own (criterion 5)", async ({
    page,
  }) => {
    await page.route(VERSION_URL_PATTERN, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "9.9.9-e2e" }),
      }),
    );
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v9.9.9-e2e");
    await expect(footer).not.toContainText("0.0.0");
  });

  test("renders only the app name when the version endpoint is unreachable (edge case)", async ({
    page,
  }) => {
    await page.route(VERSION_URL_PATTERN, (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
