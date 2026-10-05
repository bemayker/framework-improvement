import { API_BASE_URL } from "./config";

// The backend's own sentinel for "this value could not be resolved", used for
// both the version and the commit.
const UNKNOWN_SENTINEL = "unknown";

// The backend answers locally in milliseconds; 5 s leaves headroom for a cold
// container while the footer still settles instead of loading forever.
export const VERSION_REQUEST_TIMEOUT_MS = 5_000;

type VersionResponse = { version?: unknown; commit?: unknown };

export type BackendBuildInfo = { version: string; commit: string | null };

// Trimmed string, or null when missing, non-string, blank or the sentinel.
function usableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.trim();
  return text === "" || text === UNKNOWN_SENTINEL ? null : text;
}

/**
 * Reads the backend's version and commit from GET /api/version.
 *
 * Returns null when the backend answered but could not resolve a version
 * (missing, non-string, blank or the "unknown" sentinel). The commit is null
 * under the same rules while the version is still returned. Throws when the
 * backend could not be reached or read, or did not answer within
 * VERSION_REQUEST_TIMEOUT_MS. Other response fields are ignored.
 */
export async function getBackendBuildInfo(): Promise<BackendBuildInfo | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`, {
    signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse;
  const version = usableText(body.version);
  if (version === null) {
    return null;
  }
  return { version, commit: usableText(body.commit) };
}
