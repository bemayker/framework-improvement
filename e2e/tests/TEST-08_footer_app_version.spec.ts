import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(backendPyprojectPath, "utf-8"));
if (!versionMatch) {
  throw new Error("No version line found in backend/pyproject.toml");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer shows the backend version", () => {
  test("footer reads the version served by the backend", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("footer shows the app name alone when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
