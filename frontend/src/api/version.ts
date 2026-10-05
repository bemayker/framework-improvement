import { API_BASE_URL } from "./config";

// The backend's own sentinel for "my package metadata could not be read".
const UNKNOWN_BACKEND_VERSION = "unknown";

type VersionResponse = { version?: unknown };

/**
 * Reads the backend's version from GET /api/version.
 *
 * Returns the trimmed version, or null when the backend answered but could not
 * resolve one (missing, non-string, blank or the "unknown" sentinel). Throws
 * when the backend could not be reached or read. Other response fields are
 * ignored.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse;
  if (typeof body.version !== "string") {
    return null;
  }

  const version = body.version.trim();
  if (version === "" || version === UNKNOWN_BACKEND_VERSION) {
    return null;
  }
  return version;
}
