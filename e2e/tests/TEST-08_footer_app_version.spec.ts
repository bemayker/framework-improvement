import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
const pyprojectVersion = /^version\s*=\s*"([^"]+)"/m.exec(
  readFileSync(pyprojectPath, "utf-8"),
);
if (!pyprojectVersion) {
  throw new Error("No [project] version found in backend/pyproject.toml");
}
const backendVersion = pyprojectVersion[1];

/**
 * Matches the backend call on its exact pathname: Vite serves the frontend
 * module `src/api/version.ts` from a URL that shares the "/api/version" prefix.
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from GET /api/version in the footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) =>
        isVersionApiUrl(new URL(response.url())) && response.ok(),
    );

    await page.goto("/");
    await versionResponse;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveText(
      ` v${backendVersion}`,
    );
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(isVersionApiUrl, (route) => route.abort("connectionrefused"));

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
  });
});
