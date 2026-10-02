// Client for the backend's version endpoint (GET /api/version, TEST-05, TEST-09).
import { API_BASE_URL } from "./apiBaseUrl";

// Extra response fields are tolerated and ignored; `version` and `commit` are read.
export type VersionInfo = {
  version: string;
  commit: string | null;
};

// The backend answers "unknown" when its package metadata is absent (TEST-05
// UNKNOWN_VERSION). That is not a version, so it counts as unresolved.
const UNRESOLVED_BACKEND_VERSION = "unknown";

// The backend answers "unknown" when BUILD_COMMIT is unset (TEST-09
// DEFAULT_BUILD_COMMIT). That is not a commit, so it counts as absent.
const UNRESOLVED_BACKEND_COMMIT = "unknown";

// An unusable commit is absent, never an error: the version still renders.
function normaliseCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit === "") {
    return null;
  }
  return commit === UNRESOLVED_BACKEND_COMMIT ? null : commit;
}

/**
 * Fetches the backend's version and build commit. Rejects when the version
 * cannot be resolved: network error, non-OK status, malformed body, empty
 * version, or the backend's own "unknown" sentinel. An unusable commit
 * resolves as `commit: null` instead of rejecting.
 */
export async function fetchBackendVersion(): Promise<VersionInfo> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionInfo> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response body");
  }
  if (version === UNRESOLVED_BACKEND_VERSION) {
    throw new Error("Loading the version failed: backend version is unresolved");
  }

  return { version, commit: normaliseCommit(body?.commit) };
}
