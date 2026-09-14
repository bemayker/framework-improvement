import { test, expect, type Page } from "@playwright/test";

const VERSION_ENDPOINT = "**/api/version";

/**
 * Opens the landing page and returns the version the browser itself received
 * from GET /api/version. Reading the value from the page's own response keeps
 * the expected value out of the test harness: no base URL, no port and no
 * package metadata is duplicated here.
 */
async function gotoLandingPageAndReadVersion(page: Page): Promise<string> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.url().includes("/api/version") && candidate.request().method() === "GET",
    ),
    page.goto("/"),
  ]);

  const body = (await response.json()) as { version: string };
  return body.version;
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend returned from GET /api/version", async ({ page }) => {
    const version = await gotoLandingPageAndReadVersion(page);

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText("Task Notes");
    await expect(page.getByTestId("app-footer-version")).toHaveText(`v${version}`);
    await expect(page.getByTestId("app-footer-version-unavailable")).toHaveCount(0);
  });

  test("shows the version-unavailable marker when the endpoint is unreachable", async ({
    page,
  }) => {
    await page.route(VERSION_ENDPOINT, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByTestId("app-footer-version-unavailable")).toHaveText(
      "· version unavailable",
    );
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);

    const footerText = await footer.textContent();
    expect(footerText).toContain("Task Notes");
    expect(footerText).not.toContain("undefined");
    expect(footerText).not.toContain("null");
  });

  test("shows the same marker when the endpoint answers 500", async ({ page }) => {
    await page.route(VERSION_ENDPOINT, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      }),
    );

    await page.goto("/");

    await expect(page.getByTestId("app-footer-version-unavailable")).toHaveText(
      "· version unavailable",
    );
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);

    const footerText = await page.getByTestId("app-footer").textContent();
    expect(footerText).not.toContain("undefined");
    expect(footerText).not.toContain("null");
  });
});
