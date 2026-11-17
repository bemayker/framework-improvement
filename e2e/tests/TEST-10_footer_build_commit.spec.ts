import { test, expect, type Page } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Serves a fixed `/api/version` body: the local stack runs with BUILD_COMMIT
 * unset, so a seeded body is the only deterministic commit.
 */
async function fulfilVersion(page: Page, body: { version: string; commit: string }) {
  await page.route(
    (url) => url.pathname === VERSION_PATH,
    (route) => route.fulfill({ status: 200, contentType: "application/json", json: body }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the build commit next to the version", async ({
    page,
  }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "abc1234def56" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (abc1234)");
    await expect(page.getByTestId("app-footer-version")).toHaveText(" v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveText(" (abc1234)");
  });

  test("shows the version alone when the backend reports the unknown commit", async ({
    page,
  }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "unknown" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
