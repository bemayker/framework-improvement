import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version } = JSON.parse(readFileSync(frontendPackageJsonPath, "utf-8")) as {
  version: string;
};

const API_BASE_URL = process.env.VITE_API_BASE_URL ?? "http://localhost:8010";
const SHORT_COMMIT_LENGTH = 7;

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the commit from /api/version next to the version", async ({
    page,
    request,
  }) => {
    const response = await request.get(`${API_BASE_URL}/api/version`);
    expect(response.ok()).toBe(true);
    const { commit } = (await response.json()) as { commit: string };
    const expectedShortCommit = commit.trim().slice(0, SHORT_COMMIT_LENGTH);

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText(`v${version}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveText(expectedShortCommit);
    await expect(footer).toHaveText(`Task Notes v${version} (${expectedShortCommit})`);
  });

  test("shows the version alone when the version request fails", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${version}`);
    await expect(footer).not.toContainText("undefined");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
