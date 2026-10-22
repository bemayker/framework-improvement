import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The backend's declared version: [project].version in backend/pyproject.toml.
// It differs from frontend/package.json's, so this spec proves the footer's source.
const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const projectSection = readFileSync(pyprojectPath, "utf-8").split(/^\[project\]\s*$/m)[1] ?? "";
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(projectSection)?.[1];
if (!backendVersion) {
  throw new Error("Could not read [project].version from backend/pyproject.toml");
}

test.describe("TEST-08 footer app version", () => {
  test("shows the backend's version in the footer on the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows only the app name when the version endpoint is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
