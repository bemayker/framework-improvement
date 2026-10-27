import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The expected value is read from the backend's own metadata, which differs from the
// frontend package version on purpose, so the spec proves the backend is the source.
const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(backendPyprojectPath, "utf-8"));
if (versionMatch === null) {
  throw new Error("backend/pyproject.toml has no [project] version line");
}
const backendVersion = versionMatch[1];

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the app name followed by the backend version on the landing page", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${backendVersion}`);
  });

  test("shows exactly the app name when the version request is aborted", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
