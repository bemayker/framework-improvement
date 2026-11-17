import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

test.describe("TEST-10 footer build commit", () => {
  test("footer shows the short build commit next to the version", async ({ page }) => {
    const version = readBackendVersion();
    // The real backend reports `unknown` where BUILD_COMMIT is unset, so the response is fixed to a known commit.
    await page.route("**/api/version", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ version, commit: "0123456789ab" }),
      }),
    );
    const versionResponse = page.waitForResponse("**/api/version");
    await page.goto("/");
    await versionResponse;

    await expect(page.getByTestId("app-footer-commit")).toHaveText(" (0123456)");
    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version} (0123456)`);
  });
});
