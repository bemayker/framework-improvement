// Client for the backend's version endpoint (GET /api/version, TEST-05).
import { API_BASE_URL } from "./apiBaseUrl";

// Extra response fields are tolerated and ignored; only `version` is read.
export type VersionInfo = {
  version: string;
};

// The backend answers "unknown" when its package metadata is absent (TEST-05
// UNKNOWN_VERSION). That is not a version, so it counts as unresolved.
const UNRESOLVED_BACKEND_VERSION = "unknown";

/**
 * Fetches the backend's version string. Rejects when it cannot be resolved:
 * network error, non-OK status, malformed body, empty version, or the
 * backend's own "unknown" sentinel.
 */
export async function fetchBackendVersion(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionInfo> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response body");
  }
  if (version === UNRESOLVED_BACKEND_VERSION) {
    throw new Error("Loading the version failed: backend version is unresolved");
  }

  return version;
}
