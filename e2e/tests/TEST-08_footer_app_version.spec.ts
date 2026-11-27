import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

function readVersion(relativePath: string, pattern: RegExp): string {
  const match = pattern.exec(readFileSync(path.resolve(__dirname, relativePath), "utf-8"));
  if (!match) {
    throw new Error(`No version found in ${relativePath}`);
  }
  return match[1];
}

const backendVersion = readVersion("../../backend/pyproject.toml", /^version\s*=\s*"([^"]+)"/m);
const frontendVersion = readVersion("../../frontend/package.json", /"version"\s*:\s*"([^"]+)"/);

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the backend version in the footer, not the frontend package version", async ({
    page,
  }) => {
    await page.goto("/");

    const version = page.getByTestId("app-footer-version");
    await expect(version).toHaveText(`v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).not.toContainText(`v${frontendVersion}`);
  });

  test("shows the app name without a version when the version endpoint is unreachable", async ({
    page,
  }) => {
    // Exact pathname, so Vite's src/api/version.ts module request is not intercepted.
    await page.route((url) => url.pathname === "/api/version", (route) => route.abort());
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
