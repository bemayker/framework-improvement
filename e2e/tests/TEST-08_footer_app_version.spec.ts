import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the backend version in the footer on the landing page", async ({ page }) => {
    expect(backendVersion).toBeTruthy();

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/version", (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
  });
});
