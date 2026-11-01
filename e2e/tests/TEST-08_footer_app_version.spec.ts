import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";
const DIVERGING_BACKEND_VERSION = "9.9.9";

/** Reads `[project].version` from backend/pyproject.toml, the backend's declared version. */
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

function readFrontendVersion(): string {
  const packageJsonPath = path.resolve(__dirname, "../../frontend/package.json");
  return (JSON.parse(readFileSync(packageJsonPath, "utf-8")) as { version: string }).version;
}

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

async function stubBackendVersion(page: Page, version: string): Promise<void> {
  await page.route(
    (url) => isVersionApiUrl(url.toString()),
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        // The page and the API are different origins, so the browser enforces CORS
        // on a fulfilled response exactly as it does on a real one.
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version }),
      }),
  );
}

test.describe("TEST-08 footer shows the backend version", () => {
  test("shows the version the real backend reports", async ({ page }) => {
    const backendVersion = readBackendVersion();

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer.getByTestId("app-footer-version")).toHaveText(`v${backendVersion}`);
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
  });

  test("shows the backend version when it differs from the frontend package version", async ({
    page,
  }) => {
    expect(readFrontendVersion()).not.toBe(DIVERGING_BACKEND_VERSION);
    await stubBackendVersion(page, DIVERGING_BACKEND_VERSION);

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${DIVERGING_BACKEND_VERSION}`);
    await expect(footer).not.toContainText(`v${readFrontendVersion()}`);
  });

  test("renders the app name alone when the backend is unreachable", async ({ page }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort(),
    );
    const versionCallFailed = page.waitForEvent(
      "requestfailed",
      (request) => isVersionApiUrl(request.url()),
    );

    await page.goto("/");
    await versionCallFailed;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes");
    await expect(footer.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText(/unknown|undefined|null/i);
  });
});
