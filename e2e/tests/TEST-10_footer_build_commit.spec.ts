import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const backendPyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const backendVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(backendPyprojectPath, "utf-8"),
)?.[1];

if (!backendVersion) {
  throw new Error("Could not read the backend version from backend/pyproject.toml");
}

// The commit depends on how the stack was built, so the spec serves a known
// body itself. The call is cross-origin (frontend port to backend port), hence
// the CORS header on the fulfilled response.
async function serveVersion(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ version: backendVersion, commit }),
    }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    await serveVersion(page, "a1b2c3d4e5f6");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${backendVersion} (a1b2c3d)`,
    );
  });

  test("shows the version alone when the backend reports the unknown commit", async ({
    page,
  }) => {
    await serveVersion(page, "unknown");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });
});
