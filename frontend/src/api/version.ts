import { API_BASE_URL } from "./config";

/** Mirrors backend/app/schemas/version.py. */
export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this when its package metadata is not installed; it is
// not a version, so it counts as unresolved.
const UNRESOLVED_SENTINEL = "unknown";

/**
 * Fetches the backend's version, or returns null when it cannot be resolved
 * (network failure, non-OK status, unusable body, or the backend sentinel).
 * Never throws: an unresolved version is a normal outcome for the footer.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;
    if (typeof version !== "string" || version === "" || version === UNRESOLVED_SENTINEL) {
      return null;
    }
    return version;
  } catch {
    return null;
  }
}
