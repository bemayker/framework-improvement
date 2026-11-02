import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { backendVersion } from "../helpers/backendVersion";

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version: frontendVersion } = JSON.parse(readFileSync(frontendPackageJsonPath, "utf-8")) as {
  version: string;
};

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the app name and the backend version on the landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the app name alone when the version request fails", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });

  test("shows the version the backend reports, not the frontend package version", async ({
    page,
  }) => {
    const stubbedVersion = "9.9.9";
    expect(stubbedVersion).not.toBe(frontendVersion);
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: stubbedVersion }),
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${stubbedVersion}`);
  });
});
