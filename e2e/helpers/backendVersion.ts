import type { Page, Response } from "@playwright/test";

const VERSION_PATH = "/api/version";

/**
 * Matches the backend version call on its exact path.
 *
 * A substring check on "/api/version" is not enough: Vite serves the frontend
 * module `src/api/version.ts` from a URL that contains the same substring.
 */
export function isVersionApiUrl(url: string): boolean {
  return new URL(url).pathname === VERSION_PATH;
}

/**
 * Opens the landing page and returns the version the page's own
 * `GET /api/version` call received, so a spec compares the footer with the live
 * backend instead of a version typed into the spec.
 */
export async function openLandingPageAndReadBackendVersion(page: Page): Promise<string> {
  const versionResponse = page.waitForResponse(
    (response: Response) => isVersionApiUrl(response.url()) && response.ok(),
  );

  await page.goto("/");

  const body = (await (await versionResponse).json()) as { version: string };
  return body.version;
}

export interface BackendBuild {
  version: string;
  commit: string;
}

/**
 * Opens the landing page and returns the full `{ version, commit }` body the
 * page's own `GET /api/version` call received, so a spec compares the footer
 * with the live backend instead of a commit typed into the spec.
 */
export async function openLandingPageAndReadBackendBuild(page: Page): Promise<BackendBuild> {
  const versionResponse = page.waitForResponse(
    (response: Response) => isVersionApiUrl(response.url()) && response.ok(),
  );

  await page.goto("/");

  return (await (await versionResponse).json()) as BackendBuild;
}
