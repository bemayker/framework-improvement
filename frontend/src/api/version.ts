// Client for the backend's GET /api/version. The footer has one failure
// presentation, so every unresolved case collapses into null here.
import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own sentinel for "package metadata missing" (version_service).
const UNKNOWN_VERSION = "unknown";

/** Returns the backend's version, or null when it cannot be resolved. */
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_URL);

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
