import { test, expect } from "@playwright/test";

const VERSION_URL_PATTERN = "**/api/version";

// The local and CI backends report commit "unknown" unless BUILD_COMMIT is set,
// so the response is faked to keep the commit deterministic.
async function fulfilVersion(
  page: import("@playwright/test").Page,
  body: { version: string; commit: string },
) {
  await page.route(VERSION_URL_PATTERN, (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }),
  );
}

test.describe("TEST-10 footer build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "0123456789ab" });
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveText("(0123456)");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (0123456)");
  });

  test("shows the version alone when the commit is unknown", async ({ page }) => {
    await fulfilVersion(page, { version: "0.1.0", commit: "unknown" });
    await page.goto("/");

    await expect(page.getByTestId("app-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-commit")).toHaveCount(0);
  });
});
