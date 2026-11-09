import { test, expect, type Page } from "@playwright/test";

// Forwards /api/version to the real backend (keeping the browser-to-backend path)
// and replaces only the commit, since CI starts the stack without BUILD_COMMIT.
async function serveVersionWithCommit(page: Page, commit: string): Promise<{ version: string }> {
  let resolveVersion: (version: string) => void = () => undefined;
  const realVersion = new Promise<string>((resolve) => {
    resolveVersion = resolve;
  });

  await page.route("**/api/version", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { version: string; commit?: string };
    resolveVersion(body.version);
    await route.fulfill({ response, json: { ...body, commit } });
  });

  await page.goto("/");
  return { version: await realVersion };
}

test.describe("TEST-10 footer shows the build commit", () => {
  test("footer shows the first 7 characters of the commit next to the version", async ({ page }) => {
    const { version } = await serveVersionWithCommit(page, "0123456789ab");

    await expect(page.getByTestId("app-footer")).toHaveText(`Task Notes v${version} (0123456)`);
  });

  test("footer shows the version alone when the commit is unknown", async ({ page }) => {
    const { version } = await serveVersionWithCommit(page, "unknown");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(`Task Notes v${version}`);
    await expect(footer).not.toContainText("(");
  });
});
