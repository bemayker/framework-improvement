import { test, expect } from "@playwright/test";

const COMMIT_DISPLAY_LENGTH = 7;

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the version and the first 7 characters of the commit the backend served", async ({
    page,
  }) => {
    // Registered before navigation so the spec asserts against the value the live
    // backend actually served, whether it was built with a real BUILD_COMMIT or
    // the compose default "unknown".
    const versionResponse = page.waitForResponse(
      (response) => response.url().endsWith("/api/version") && response.ok(),
    );

    await page.goto("/");

    const body = (await (await versionResponse).json()) as { version: string; commit: string };
    const shortCommit = body.commit.slice(0, COMMIT_DISPLAY_LENGTH);

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-commit")).toHaveText(shortCommit);
    await expect(footer).toHaveText(`Task Notes v${body.version} (${shortCommit})`);
  });

  test("cuts a long commit to its first 7 characters", async ({ page }) => {
    // The live backend serves "unknown" (exactly 7 characters) locally and in
    // compose CI, so only a stubbed response can prove the cut itself.
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "9.9.9", commit: "abcdef1234567" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9 (abcdef1)");
    await expect(page.getByTestId("app-commit")).toHaveText("abcdef1");
  });

  test("shows the version alone when the response carries no commit", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify({ version: "9.9.9" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v9.9.9");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
