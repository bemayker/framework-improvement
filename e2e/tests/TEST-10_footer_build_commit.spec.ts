import { test, expect, type Page } from "@playwright/test";

const stubbedVersion = "9.9.9";

async function stubVersionResponse(page: Page, commit: string) {
  await page.route("**/api/version", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ version: stubbedVersion, commit }),
    }),
  );
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit next to the version", async ({ page }) => {
    await stubVersionResponse(page, "abc1234def56");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${stubbedVersion} (abc1234)`);
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(abc1234)");
  });

  test("shows the version alone when the backend reports the unknown commit", async ({ page }) => {
    await stubVersionResponse(page, "unknown");
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${stubbedVersion}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
