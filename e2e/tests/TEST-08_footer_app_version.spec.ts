import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// The expected value comes from the backend's own declaration, which differs from
// frontend/package.json, so the spec fails if the footer reads the wrong source.
const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(readFileSync(pyprojectPath, "utf-8"))?.[1];

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version in the landing page footer", async ({ page }) => {
    expect(backendVersion).toBeTruthy();
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveText(`v${backendVersion}`);
  });

  test("renders the footer without a version when the version request is aborted", async ({
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
