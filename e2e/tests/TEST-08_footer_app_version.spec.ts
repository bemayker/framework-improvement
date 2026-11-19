import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The footer shows the backend's version, declared in backend/pyproject.toml.
const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(backendPyprojectPath, "utf-8"));
if (!versionMatch) {
  throw new Error("No version found in backend/pyproject.toml");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend-reported version in the landing page footer", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("renders the app name alone when the version request is aborted", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
