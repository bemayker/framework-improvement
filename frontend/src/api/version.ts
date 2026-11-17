// Client for the backend's GET /api/version. The footer has one failure
// presentation, so every unresolved case collapses into null here.
import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

// `commit` is already cut to SHORT_COMMIT_LENGTH, or null when unusable.
export type BackendVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own sentinel for "package metadata missing" (version_service).
const UNKNOWN_VERSION = "unknown";

// The backend's default when BUILD_COMMIT is not set.
const UNKNOWN_COMMIT = "unknown";

const SHORT_COMMIT_LENGTH = 7;

/** Returns the backend's version and short commit, or null when the version cannot be resolved. */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
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

    const commit = body?.commit;
    const hasUsableCommit =
      typeof commit === "string" && commit !== "" && commit !== UNKNOWN_COMMIT;

    return {
      version,
      commit: hasUsableCommit ? commit.slice(0, SHORT_COMMIT_LENGTH) : null,
    };
  } catch {
    return null;
  }
}
