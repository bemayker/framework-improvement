import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");

// [project].version is the first top-level `version = "..."` line in the file.
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];
const { version: frontendVersion } = JSON.parse(
  readFileSync(frontendPackageJsonPath, "utf-8"),
) as { version: string };

test.describe("TEST-08 footer shows the backend app version", () => {
  test("shows the backend pyproject version and not the frontend package version", async ({
    page,
  }) => {
    expect(backendVersion).toBeTruthy();
    expect(backendVersion).not.toBe(frontendVersion);

    await page.goto("/");

    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).not.toContainText(`v${frontendVersion}`);
  });

  test("shows only the app name when the version endpoint is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
