// Client for the backend's GET /api/version endpoint.

import { API_BASE_URL } from "./apiBaseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * The value the backend returns when it cannot resolve its own version.
 * Counterpart of UNKNOWN_VERSION in backend/app/services/version_service.py.
 */
export const BACKEND_UNKNOWN_VERSION = "unknown";

type VersionResponse = {
  version: string;
};

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/**
 * Fetches the backend's version. Returns null when the backend answered but
 * could not resolve a version (blank or the "unknown" sentinel); throws when the
 * request failed or the body has an unexpected shape. Other fields are ignored.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = body.version.trim();
  if (version === "" || version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
