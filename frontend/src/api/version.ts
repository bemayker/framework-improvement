// Client for the backend's GET /api/version (TEST-05). It never throws: the
// footer treats every way of not resolving a version the same, as null.
import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
};

// The backend's own sentinel for "package metadata missing" (version_service.py).
const UNKNOWN_VERSION = "unknown";

/** Returns the backend's version, or null when it cannot be resolved. */
export async function getBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/version`);

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;

    if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
      return null;
    }

    return version;
  } catch {
    return null;
  }
}
