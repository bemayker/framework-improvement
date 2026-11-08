// Client for the backend's version endpoint: components never call fetch
// directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

// The backend answers with this sentinel when its package metadata is missing
// (backend/app/services/version_service.py); it is not a version to display.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the response carries no
 * usable version (missing, empty, or the backend's "unknown" sentinel) and
 * rejects on a network error or a non-OK status.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
