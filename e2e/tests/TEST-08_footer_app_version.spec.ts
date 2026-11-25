import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";

/** Reads `[project].version` so the expected value is never a typed literal. */
function readBackendVersion(): string {
  const pyprojectPath = path.resolve(__dirname, "../../backend/pyproject.toml");
  const pyproject = readFileSync(pyprojectPath, "utf-8");
  const projectSection = pyproject.split(/^\[project\]\s*$/m)[1] ?? "";
  const match = /^version\s*=\s*"([^"]+)"/m.exec(projectSection);
  if (!match) {
    throw new Error("No [project].version found in backend/pyproject.toml");
  }
  return match[1];
}

/**
 * Matches the backend call on its exact pathname: Vite serves the module
 * `src/api/version.ts` from a URL containing the same substring.
 */
function isVersionApiRequest(request: Request): boolean {
  return new URL(request.url()).pathname === VERSION_PATH;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the backend version in the landing page footer", async ({ page }) => {
    const backendVersion = readBackendVersion();

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-footer-version")).toBeVisible();
    await expect(footer).toContainText(`v${backendVersion}`);
    // The version element alone: a configured BUILD_COMMIT adds a commit element after it (TEST-10).
    await expect(page.getByTestId("app-footer-version")).toHaveText(` v${backendVersion}`);
  });

  test("omits the version when /api/version is unreachable", async ({ page }) => {
    await page.route("**/api/version", (route) => route.abort());
    // Registered before navigation so the failure is observed, not the loading state.
    const failedRequest = page.waitForEvent(
      "requestfailed",
      (request) => isVersionApiRequest(request),
    );

    await page.goto("/");
    await failedRequest;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
  });
});
