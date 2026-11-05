import { test, expect, type Page } from "@playwright/test";

// The endpoint is fulfilled with a fixed body so the result does not depend on the
// BUILD_COMMIT the stack was started with.
async function fulfillVersion(page: Page, body: { version: string; commit: string }) {
  await page.route("**/api/version", (route) => route.fulfill({ json: body }));
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfillVersion(page, { version: "0.1.0", commit: "0123456789ab" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer-version")).toHaveText("v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(0123456)");
    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0 (0123456)");
  });

  test("shows the version alone when the backend reports the unknown commit", async ({ page }) => {
    await fulfillVersion(page, { version: "0.1.0", commit: "unknown" });

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
