import { API_BASE_URL } from "./baseUrl";

type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this when its package metadata is missing; showing the
// word "unknown" in the footer would be misleading, so it counts as unresolved.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves null when the response carries no
 * usable version; rejects on a network error or a non-OK response. Fields other
 * than `version` are ignored.
 */
export async function fetchAppVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

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
