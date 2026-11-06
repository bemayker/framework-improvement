import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

// The backend answers with this sentinel when it cannot resolve its own
// version (UNKNOWN_VERSION in backend/app/services/version_service.py).
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { version } = body as { version?: unknown };
  return typeof version === "string" && version !== "";
}

/**
 * Fetches the backend's version. Rejects whenever no usable version can be
 * resolved (network error, non-OK status, malformed body, or the backend's
 * "unknown" sentinel), so callers treat every rejection as "no version".
 */
export async function getBackendVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response body");
  }

  if (body.version === BACKEND_UNKNOWN_VERSION) {
    throw new Error("Loading the version failed: backend version is unknown");
  }

  return body.version;
}
