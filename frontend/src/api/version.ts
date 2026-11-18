// Client for the backend's version endpoint (GET /api/version). Components
// never call fetch directly.
import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

// What the backend reports when its package metadata is missing; it reads like
// a version string, so it is treated as unresolved.
const UNKNOWN_VERSION = "unknown";
// What the backend reports when no BUILD_COMMIT is set.
const UNKNOWN_COMMIT = "unknown";
// The backend sends 12 characters; the footer shows 7 (TEST-10).
const COMMIT_DISPLAY_LENGTH = 7;

/**
 * Resolves the backend's version and short commit, or null when the backend
 * reports its "unknown" version sentinel. The commit is null when it is
 * unknown, empty or not a string, so a bad commit never hides a good version.
 * Throws when the request fails or the version is malformed.
 */
export async function getBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: malformed response body");
  }

  if (version === UNKNOWN_VERSION) return null;

  const commit = body?.commit;
  const hasCommit =
    typeof commit === "string" && commit !== "" && commit !== UNKNOWN_COMMIT;

  return {
    version,
    commit: hasCommit ? commit.slice(0, COMMIT_DISPLAY_LENGTH) : null,
  };
}
