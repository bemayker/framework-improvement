import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];

if (!backendVersion) {
  throw new Error("Could not read the backend version from backend/pyproject.toml");
}

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version: bundleVersion } = JSON.parse(readFileSync(frontendPackageJsonPath, "utf-8")) as {
  version: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from GET /api/version in the footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    // The stack may or may not have been built with BUILD_COMMIT (TEST-10).
    await expect(footer).toHaveText(
      new RegExp(`^Task Notes v${escapeRegExp(backendVersion)}( \\([0-9a-f]{7}\\))?$`),
    );
    if (bundleVersion !== backendVersion) {
      await expect(footer).not.toContainText(`v${bundleVersion}`);
    }
  });

  test("shows only the app name when GET /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
