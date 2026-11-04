// Client for the backend's GET /api/version endpoint.

import { API_BASE_URL } from "./apiBaseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * The value the backend returns when it cannot resolve its own version or
 * build commit. Counterpart of UNKNOWN_VERSION in
 * backend/app/services/version_service.py and of DEFAULT_BUILD_COMMIT in
 * backend/app/core/config.py.
 */
export const BACKEND_UNKNOWN_VERSION = "unknown";

/** Normalized build info; a field is null when the backend could not resolve it. */
export type BackendBuildInfo = {
  version: string | null;
  commit: string | null;
};

type VersionResponse = {
  version: string;
  commit?: unknown;
};

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Trims a value and maps blank, the "unknown" sentinel and non-strings to null. */
function normalize(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN_VERSION ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit. A field is null when the
 * backend answered but could not resolve it (blank, missing, non-string or the
 * "unknown" sentinel); throws when the request failed or the body has no string
 * version. The commit is returned unshortened.
 */
export async function getBackendBuildInfo(): Promise<BackendBuildInfo> {
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

  return { version: normalize(body.version), commit: normalize(body.commit) };
}
