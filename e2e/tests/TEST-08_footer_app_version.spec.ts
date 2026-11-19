import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The backend's declared version: the single source GET /api/version serves.
const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(backendPyprojectPath, "utf-8"));
if (!versionMatch) {
  throw new Error("No version found in backend/pyproject.toml");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from /api/version in the landing page footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.ok(),
    );
    await page.goto("/");
    await versionResponse;

    // Anchored: the exact version, then an optional " (7-character commit)" suffix shown when BUILD_COMMIT is set.
    const escapedVersion = backendVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page.getByTestId("app-footer")).toHaveText(
      new RegExp(`^Task Notes v${escapedVersion}( \\([0-9a-zA-Z]{7}\\))?$`),
    );
  });

  test("renders the footer with the app name and the backend version", async ({ page }) => {
    await page.goto("/");

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(`v${backendVersion}`);
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
