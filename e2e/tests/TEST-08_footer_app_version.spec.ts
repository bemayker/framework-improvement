import { test, expect, type Request } from "@playwright/test";

const VERSION_PATH = "/api/version";
const HELD_VERSION = "7.7.7";
const APP_NAME = "Task Notes";
const UNAVAILABLE_FOOTER_TEXT = `${APP_NAME} · version unavailable`;

/**
 * Headers every mocked version response carries.
 *
 * A fulfilled route is still subject to the browser's CORS check and no server
 * is involved to answer it, so a mock of a cross-origin endpoint without this
 * header is blocked and the page sees a network error instead of the status the
 * spec is asserting about.
 */
const MOCK_RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

/**
 * Matches the backend version call on its exact path.
 *
 * A glob or substring match on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL containing the same substring, so a
 * loose matcher intercepts the module fetch instead of the API call (TEST-03
 * records the same trap for `/api/notes`).
 */
function isVersionApiUrl(url: URL): boolean {
  return url.pathname === VERSION_PATH;
}

function isVersionApiRequest(request: Request): boolean {
  return isVersionApiUrl(new URL(request.url()));
}

test.describe("TEST-08 footer app version", () => {
  test("shows the version the backend returned for GET /api/version", async ({
    page,
  }) => {
    const versionResponse = page.waitForResponse(
      (response) => isVersionApiRequest(response.request()) && response.ok(),
    );

    await page.goto("/");

    const { version } = (await (await versionResponse).json()) as {
      version: string;
    };

    await expect(page.getByTestId("app-footer-version")).toHaveText(
      `v${version}`,
    );
    await expect(page.getByTestId("app-footer")).toContainText(
      `${APP_NAME} v${version}`,
    );
  });

  test("renders the footer without a version when the backend is unreachable", async ({
    page,
  }) => {
    await page.route(isVersionApiUrl, (route) => route.abort());

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(UNAVAILABLE_FOOTER_TEXT);
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("null");
  });

  test("renders the footer without a version when the backend answers 500", async ({
    page,
  }) => {
    await page.route(isVersionApiUrl, (route) =>
      route.fulfill({ status: 500, headers: MOCK_RESPONSE_HEADERS, body: "" }),
    );

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(UNAVAILABLE_FOOTER_TEXT);
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(footer).not.toContainText("undefined");
    await expect(footer).not.toContainText("null");
  });

  test("shows only the app name while GET /api/version has not answered yet", async ({
    page,
  }) => {
    let releaseVersionResponse: (() => void) | undefined;
    const versionResponseHeld = new Promise<void>((resolve) => {
      releaseVersionResponse = resolve;
    });

    await page.route(isVersionApiUrl, async (route) => {
      await versionResponseHeld;
      await route.fulfill({
        status: 200,
        headers: MOCK_RESPONSE_HEADERS,
        body: JSON.stringify({ version: HELD_VERSION }),
      });
    });

    await page.goto("/");

    const footer = page.getByTestId("app-footer");
    await expect(footer).toHaveText(APP_NAME);
    await expect(page.getByTestId("app-footer-version")).toHaveCount(0);
    await expect(page.getByTestId("app-footer-version-unavailable")).toHaveCount(
      0,
    );

    releaseVersionResponse?.();

    await expect(page.getByTestId("app-footer-version")).toHaveText(
      `v${HELD_VERSION}`,
    );
    await expect(footer).toHaveText(`${APP_NAME} v${HELD_VERSION}`);
  });
});
