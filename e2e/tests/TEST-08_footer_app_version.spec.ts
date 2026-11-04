import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  isVersionApiUrl,
  openLandingPageAndReadBackendVersion,
} from "../helpers/backendVersion";

const frontendPackageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
const { version: frontendVersion } = JSON.parse(
  readFileSync(frontendPackageJsonPath, "utf-8"),
) as { version: string };

test.describe("TEST-08 footer shows the backend version", () => {
  test("footer reads the version the live backend reports", async ({ page }) => {
    const backendVersion = await openLandingPageAndReadBackendVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-version")).toBeVisible();

    // The two sources differ today; when they do, the footer must not show the
    // frontend package's version.
    if (frontendVersion !== backendVersion) {
      await expect(footer).not.toContainText(frontendVersion);
    }
  });

  test("footer reads only the app name when the version request fails", async ({ page }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort(),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
