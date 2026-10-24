import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = readFileSync(backendPyprojectPath, "utf-8").match(
  /^version\s*=\s*"([^"]+)"/m,
);
if (!versionMatch) {
  throw new Error("backend/pyproject.toml declares no version line");
}
const backendVersion = versionMatch[1];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("TEST-08 footer shows the backend app version", () => {
  test("shows the backend's version, read from backend/pyproject.toml, in the footer", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    // The footer carries " (7 hex chars)" whenever the stack runs with BUILD_COMMIT set (TEST-10).
    await expect(footer).toHaveText(
      new RegExp(`^Task Notes v${escapeRegExp(backendVersion)}( \\([0-9a-f]{7}\\))?$`),
    );
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
