import { test, expect } from "@playwright/test";
import {
  isVersionApiUrl,
  openLandingPageAndReadBackendBuild,
} from "../helpers/backendVersion";

const FULL_COMMIT = "5796772ab1cd";

test.describe("TEST-10 footer shows the build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({
    page,
  }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ version: "0.1.0", commit: FULL_COMMIT }),
        }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(page.getByTestId("app-commit")).toHaveText("(5796772)");
    await expect(footer).toHaveText("Task Notes v0.1.0 (5796772)");
    await expect(footer).not.toContainText(FULL_COMMIT);
  });

  test("footer agrees with the commit the live backend reports", async ({ page }) => {
    const { version, commit } = await openLandingPageAndReadBackendBuild(page);

    const footer = page.getByTestId("app-footer");
    if (commit === "unknown") {
      // CI builds the backend without BUILD_COMMIT: the version stands alone.
      await expect(page.getByTestId("app-version")).toHaveText(`v${version}`);
      await expect(footer).toHaveText(`Task Notes v${version}`);
      await expect(page.getByTestId("app-commit")).toHaveCount(0);
    } else {
      await expect(page.getByTestId("app-commit")).toHaveText(`(${commit.slice(0, 7)})`);
    }
  });

  test("footer reads only the app name when the version request fails", async ({ page }) => {
    await page.route(
      (url) => isVersionApiUrl(url.toString()),
      (route) => route.abort(),
    );

    const failedRequest = page.waitForEvent("requestfailed", (request) =>
      isVersionApiUrl(request.url()),
    );
    await page.goto("/");
    await failedRequest;

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes");
    await expect(page.getByTestId("app-version")).toHaveCount(0);
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
    await expect(footer).not.toContainText(/undefined|null|unknown|error/i);
  });
});
