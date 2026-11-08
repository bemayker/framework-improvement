import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version: frontendVersion } = JSON.parse(readFileSync(frontendPackageJsonPath, "utf-8")) as {
  version: string;
};

test.describe("TEST-08 footer shows the backend version", () => {
  test("footer shows the version the live backend reports, not the frontend package version", async ({
    page,
  }) => {
    expect(backendVersion).toBeTruthy();

    await page.goto("/");

    const footerVersion = page.getByTestId("app-footer-version");
    await expect(footerVersion).toHaveText(`v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).toContainText(`Task Notes v${backendVersion}`);
    if (frontendVersion !== backendVersion) {
      await expect(page.getByTestId("app-footer")).not.toContainText(`v${frontendVersion}`);
    }
  });

  test("footer reads Task Notes alone when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
