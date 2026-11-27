import { test, expect } from "@playwright/test";

const VERSION_PATH = "/api/version";

test.describe("TEST-08 footer app version", () => {
  test("shows the version reported by GET /api/version in the landing page footer", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    const { version, commit } = (await (await versionResponse).json()) as {
      version: string;
      commit?: unknown;
    };
    const trimmedCommit = typeof commit === "string" ? commit.trim() : "";
    const commitSuffix =
      trimmedCommit !== "" && trimmedCommit !== "unknown"
        ? ` (${trimmedCommit.slice(0, 7)})`
        : "";

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${version}${commitSuffix}`,
    );
  });

  test("renders the footer with the app name and the backend version", async ({ page }) => {
    const versionResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    const { version } = (await (await versionResponse).json()) as { version: string };

    const footer = page.getByRole("contentinfo");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(footer).toContainText(version);
  });

  test("renders exactly the app name when GET /api/version fails", async ({ page }) => {
    await page.route(`**${VERSION_PATH}`, (route) => route.abort());
    const failedRequest = page.waitForEvent(
      "requestfailed",
      (request) => new URL(request.url()).pathname === VERSION_PATH,
    );
    await page.goto("/");
    await failedRequest;

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes");
  });
});
