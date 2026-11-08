import { test, expect, type Page } from "@playwright/test";

// CI and local stacks build the backend without BUILD_COMMIT, so the live commit is
// "unknown"; the response is fulfilled to assert a real 7-character value deterministically.
async function fulfilVersion(page: Page, commit: string): Promise<void> {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: "0.1.0", commit }),
    }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await fulfilVersion(page, "a1b2c3d4e5f6");

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText("Task Notes v0.1.0 (a1b2c3d)");
    const footerCommit = page.getByTestId("app-footer-commit");
    await expect(footerCommit).toContainText("(a1b2c3d)");
    await expect(footerCommit).not.toContainText("a1b2c3d4");
  });

  test("footer shows the version alone when the commit is unknown", async ({ page }) => {
    await fulfilVersion(page, "unknown");

    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText("Task Notes v0.1.0");
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
