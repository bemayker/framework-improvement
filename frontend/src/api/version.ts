import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend's own "could not resolve" answer, which is not a version to show.
const UNKNOWN_VERSION = "unknown";

// Mirrors DEFAULT_BUILD_COMMIT in backend/app/core/config.py: the backend's
// answer when no build commit was injected, which is not a commit to show.
const UNKNOWN_COMMIT = "unknown";

/**
 * Fetches the backend's version and build commit. Resolves null when the
 * backend reports its unknown version sentinel; the commit is null when it is
 * the unknown sentinel, blank, missing or not a string (the version is still
 * a valid answer then). Rejects on network failure, non-OK status or a body
 * without a usable version string.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version =
    typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  if (version === UNKNOWN_VERSION) {
    return null;
  }

  const commit = typeof body?.commit === "string" ? body.commit.trim() : "";

  return {
    version,
    commit: commit === "" || commit === UNKNOWN_COMMIT ? null : commit,
  };
}
