import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own "could not resolve" answer: UNKNOWN_VERSION in
// backend/app/services/version_service.py. Treated as no version.
const BACKEND_UNKNOWN_VERSION = "unknown";

// The backend's "could not resolve" commit: DEFAULT_BUILD_COMMIT in
// backend/app/core/config.py. Treated as no commit.
const BACKEND_UNKNOWN_COMMIT = "unknown";

// The footer shows the conventional short form of a commit hash.
const SHORT_COMMIT_LENGTH = 7;

export interface BackendBuildInfo {
  version: string;
  commit: string | null;
}

function toShortCommit(commit: unknown): string | null {
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
 * Fetches the backend's version and short build commit at runtime from one
 * response. Returns null when the backend reports no usable version (missing,
 * not a string, blank, or "unknown"); the commit is null when it is unusable.
 * Throws on a non-OK status; network errors propagate from fetch.
 */
export async function getBackendBuildInfo(): Promise<BackendBuildInfo | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as {
    version?: unknown;
    commit?: unknown;
  } | null;
  const version = body?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmedVersion = version.trim();
  if (trimmedVersion === "" || trimmedVersion === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return { version: trimmedVersion, commit: toShortCommit(body?.commit) };
}
