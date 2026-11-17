import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/** The backend's declared version, read from its own metadata so no literal is typed here. */
function readBackendVersion(): string {
  const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
  const projectSection = readFileSync(pyprojectPath, "utf-8").split(/^\[/m).find((section) =>
    section.startsWith("project]"),
  );
  const match = projectSection?.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("backend/pyproject.toml has no [project] version");
  }
  return match[1];
}

/**
 * Matches the backend call on its exact pathname: Vite serves the module
 * `src/api/version.ts` from a URL that contains "/api/version" as a substring.
 */
function isVersionApiRequest(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

const backendVersion = readBackendVersion();

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version from GET /api/version in the footer", async ({ page }) => {
    const versionRequest = page.waitForRequest(
      (request: Request) => isVersionApiRequest(new URL(request.url())) && request.method() === "GET",
    );

    await page.goto("/");
    await versionRequest;

    await expect(page.getByTestId("app-footer-version")).toHaveText(` v${backendVersion}`);
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the version the backend reports, not the frontend bundle's", async ({ page }) => {
    await page.route(isVersionApiRequest, (route) =>
      route.fulfill({ json: { version: "9.9.9" } }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9");
  });

  test("renders the footer without a version when /api/version is unreachable", async ({
    page,
  }) => {
    await page.route(isVersionApiRequest, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
