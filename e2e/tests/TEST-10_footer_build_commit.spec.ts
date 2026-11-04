import { test, expect } from "@playwright/test";
import { readBackendVersion } from "../helpers/backendVersion";

const backendVersion = readBackendVersion();

// CI and default local runs leave BUILD_COMMIT unset, so the real backend answers
// "unknown"; the spec fulfils /api/version itself to get a deterministic commit.
test.describe("TEST-10 footer shows the build commit", () => {
  test("shows the first 7 characters of the commit after the version", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({
        json: { version: backendVersion, commit: "0123456789ab" },
      }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(
      `Task Notes v${backendVersion} (0123456)`,
    );
    await expect(page.getByTestId("app-footer-commit")).toHaveText("(0123456)");
  });

  test("omits the commit when the backend reports 'unknown'", async ({ page }) => {
    await page.route("**/api/version", (route) =>
      route.fulfill({ json: { version: backendVersion, commit: "unknown" } }),
    );
    await page.goto("/");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${backendVersion}`);
    await expect(page.getByTestId("app-footer-commit")).toHaveCount(0);
  });
});
