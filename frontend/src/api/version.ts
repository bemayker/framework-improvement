// Client layer for the backend's version endpoint: components never call fetch
// directly (coding_standards.md Section 4, applied to this project's own
// backend). The version the footer shows is whatever the running backend
// reports about itself, never a value compiled into this bundle.

import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

/** The request is abandoned after this, so a hung backend cannot pin the footer
 *  in its loading state forever. */
export const VERSION_REQUEST_TIMEOUT_MS = 5000;

const VERSION_URL = `${API_BASE_URL}/api/version`;

const FAILURE_PREFIX = "Loading the version failed";

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isVersionResponse(body: unknown): body is VersionResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const version = (body as { version?: unknown }).version;

  return typeof version === "string" && version.trim() !== "";
}

/**
 * Resolves to the `version` the backend reports, verbatim — including its own
 * `"unknown"` sentinel, which says something true about the backend and is not
 * rewritten here.
 *
 * Rejects with an Error prefixed `Loading the version failed:` on a network
 * error, a timeout, any non-2xx status, a body that is not JSON, and a body
 * without a non-empty string `version`. There is no retry: a footer label is
 * not worth a second request, and the caller's unavailable state is the
 * designed answer (coding_standards.md Section 4 makes retry conditional).
 */
export async function fetchVersion(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    VERSION_REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(VERSION_URL, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        `${FAILURE_PREFIX}: timed out after ${VERSION_REQUEST_TIMEOUT_MS} ms`,
      );
    }
    throw new Error(`${FAILURE_PREFIX}: ${describeError(error)}`);
  } finally {
    // Cleared as soon as the request settles, so a late abort cannot cut off
    // the body read below.
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(
      `${FAILURE_PREFIX}: ${response.status} ${response.statusText}`,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${FAILURE_PREFIX}: the response body was not JSON`);
  }

  if (!isVersionResponse(body)) {
    throw new Error(
      `${FAILURE_PREFIX}: the response carried no version string`,
    );
  }

  return body.version;
}
