// Client for the backend's own version endpoint.
import { API_BASE_URL } from "./config";

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
// backend's sentinel for "package metadata missing", which is not a version.
const UNKNOWN_VERSION = "unknown";

// Mirrors UNKNOWN_BUILD_COMMIT in backend/app/core/config.py: the backend's
// sentinel for "no build commit set", which is not a commit.
const UNKNOWN_BUILD_COMMIT = "unknown";

const SHORT_COMMIT_LENGTH = 7;

/**
 * Fetches the backend's version and short build commit. Resolves to `null`
 * when the response carries no usable version (missing, empty, non-string or
 * the `unknown` sentinel); the commit is `null` when it is missing, empty,
 * non-string or the `unknown` sentinel, else its first 7 characters. Rejects
 * on a network error or a non-2xx response.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "" || version === UNKNOWN_VERSION) {
    return null;
  }

  const commit = typeof body?.commit === "string" ? body.commit.trim() : "";

  return {
    version,
    commit:
      commit === "" || commit === UNKNOWN_BUILD_COMMIT
        ? null
        : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
