import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

// The backend answers with this sentinel when it cannot resolve its own
// version (UNKNOWN_VERSION in backend/app/services/version_service.py).
const BACKEND_UNKNOWN_VERSION = "unknown";

// The same kind of sentinel for the build commit (UNKNOWN_BUILD_COMMIT in
// backend/app/core/config.py).
const BACKEND_UNKNOWN_COMMIT = "unknown";

const SHORT_COMMIT_LENGTH = 7;

export type BackendVersion = {
  version: string;
  // null when the backend has no usable commit; the version is still good.
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { version } = body as { version?: unknown };
  return typeof version === "string" && version !== "";
}

function shortCommit(body: object): string | null {
  const { commit } = body as { commit?: unknown };
  if (typeof commit !== "string") {
    return null;
  }
  const trimmed = commit.trim();
  if (trimmed === "" || trimmed === BACKEND_UNKNOWN_COMMIT) {
    return null;
  }
  return trimmed.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's version and short build commit. Rejects whenever no
 * usable version can be resolved (network error, non-OK status, malformed
 * body, or the backend's "unknown" sentinel), so callers treat every rejection
 * as "no version". An unusable commit never rejects: it resolves as null.
 */
export async function getBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response body");
  }

  if (body.version === BACKEND_UNKNOWN_VERSION) {
    throw new Error("Loading the version failed: backend version is unknown");
  }

  return { version: body.version, commit: shortCommit(body) };
}
