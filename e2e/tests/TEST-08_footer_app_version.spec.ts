import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The backend's version is the one declared in pyproject.toml, read from disk the way the
// TEST-05 integration test does, so the spec follows a version bump without an edit.
const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(pyprojectPath, "utf-8"))?.[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from GET /api/version in the footer", async ({ page }) => {
    expect(backendVersion).toBeTruthy();

    await page.goto("/");

    await expect(page.getByTestId("app-version")).toContainText(backendVersion as string);
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows only the app name in the footer when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
