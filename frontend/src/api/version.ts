// Client for the backend's GET /api/version (TEST-05), used by the page footer.
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Counterpart of UNKNOWN_VERSION in backend/app/services/version_service.py:
// the backend answers it when its package metadata is missing, and it must
// never be shown as if it were a version.
const BACKEND_UNKNOWN_VERSION = "unknown";

type VersionResponse = {
  version?: unknown;
};

/**
 * Resolves the backend version, or null when the backend answered without a
 * usable one. Rejects on a non-OK status or a network failure.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse | null;
  const version = body?.version;

  if (
    typeof version !== "string" ||
    version === "" ||
    version === BACKEND_UNKNOWN_VERSION
  ) {
    return null;
  }

  return version;
}
