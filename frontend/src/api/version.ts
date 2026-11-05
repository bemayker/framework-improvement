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

/** Trimmed text, or null when the value is not a string, blank, or the sentinel. */
function usableText(value: unknown, unknownSentinel: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" || trimmed === unknownSentinel ? null : trimmed;
}

function toShortCommit(commit: unknown): string | null {
  return usableText(commit, BACKEND_UNKNOWN_COMMIT)?.slice(0, SHORT_COMMIT_LENGTH) ?? null;
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
  const version = usableText(body?.version, BACKEND_UNKNOWN_VERSION);

  if (version === null) {
    return null;
  }

  return { version, commit: toShortCommit(body?.commit) };
}
