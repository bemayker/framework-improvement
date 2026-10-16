import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

function readVersion(relativePath: string, pattern: RegExp): string {
  const content = readFileSync(path.resolve(__dirname, relativePath), "utf-8");
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`No version found in ${relativePath}`);
  }
  return match[1];
}

// The footer shows the backend version, which the backend reads from this file.
const backendVersion = readVersion("../../backend/pyproject.toml", /^version\s*=\s*"([^"]+)"/m);
const frontendVersion = (
  JSON.parse(readFileSync(path.resolve(__dirname, "../../frontend/package.json"), "utf-8")) as {
    version: string;
  }
).version;

test.describe("TEST-08 footer shows the app version", () => {
  test("shows the backend version in the footer, not the frontend package version", async ({
    page,
  }) => {
    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveText(` v${backendVersion}`);
    if (frontendVersion !== backendVersion) {
      await expect(footer).not.toContainText(frontendVersion);
    }
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    // Exact pathname match: Vite serves src/api/version.ts from a URL that
    // contains "/api/version" as a substring, so a substring matcher would
    // abort the module fetch and break the page instead.
    await page.route(
      (url) => url.pathname === VERSION_PATH,
      (route) => route.abort(),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown/);
  });
});
