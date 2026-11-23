// Client for the backend's version endpoint (GET /api/version). Components
// never call fetch directly, matching the notes client.

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

/** The value the backend answers when its package metadata is missing. */
const UNKNOWN_VERSION = "unknown";

const VERSION_REQUEST_TIMEOUT_MS = 5000;

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string" &&
    (body as { version: string }).version.length > 0
  );
}

/**
 * Fetches the backend's version. Returns null when the backend reports that it
 * cannot resolve its own version; throws on a network error, a timeout, a
 * non-OK response or a body without a version string.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL, {
    signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return body.version === UNKNOWN_VERSION ? null : body.version;
}
