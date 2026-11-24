import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(pyprojectPath, "utf-8"));
if (versionMatch === null) {
  throw new Error("backend/pyproject.toml has no version line");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from /api/version in the landing page footer", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveText(`v${backendVersion}`);
  });

  test("shows only the app name when /api/version is unreachable", async ({ page }) => {
    // Exact pathname match: Vite serves the module src/api/version.ts from a URL that
    // also contains "/api/version", and aborting that would break the page itself.
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort(),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
