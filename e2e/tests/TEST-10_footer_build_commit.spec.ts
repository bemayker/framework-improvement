import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

const BUILD_COMMIT = "0123456789ab";

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
 * Lets the real backend answer `/api/version` and overrides only its `commit`,
 * so the expected footer does not depend on the BUILD_COMMIT of the run.
 */
async function overrideReportedCommit(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Record<string, unknown>;
    await route.fulfill({ response, json: { ...body, commit } });
  });
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    const backendVersion = readBackendVersion();
    await overrideReportedCommit(page, BUILD_COMMIT);

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    const commit = page.getByTestId("app-footer-commit");
    await expect(commit).toBeVisible();
    await expect(commit).toHaveText(`(${BUILD_COMMIT.slice(0, 7)})`);
    await expect(footer).toHaveText(
      `Task Notes v${backendVersion} (${BUILD_COMMIT.slice(0, 7)})`,
    );
  });

  test("shows the version alone when the backend reports the unknown commit", async ({
    page,
  }) => {
    const backendVersion = readBackendVersion();
    await overrideReportedCommit(page, "unknown");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-footer-version")).toBeVisible();
    await expect(footer).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("unknown");
  });
});
