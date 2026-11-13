import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The backend's declared version source: [project].version in backend/pyproject.toml,
// which is what GET /api/version reports on a correctly installed stack.
const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(backendPyprojectPath, "utf-8"));
if (!versionMatch) {
  throw new Error("backend/pyproject.toml has no [project] version");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from /api/version in the landing page footer", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("renders the app name only when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
