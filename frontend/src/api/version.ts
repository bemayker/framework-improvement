import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

// The backend answers this when its package metadata is missing; it is not a
// version a reader can use, so it counts as unresolved.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version, or null when it cannot be resolved.
 * Every failure collapses to null because the footer has one non-version
 * answer; this function never throws.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/version`);
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;
    if (
      typeof version !== "string" ||
      version === "" ||
      version === UNKNOWN_VERSION
    ) {
      return null;
    }
    return version;
  } catch {
    return null;
  }
}
