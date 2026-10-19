// Client for the backend version endpoint: components never call fetch directly
// (coding_standards.md Section 4).
import { API_BASE_URL } from "./config";

// Mirrors backend/app/services/version_service.py UNKNOWN_VERSION: the backend
// returns this sentinel when its package metadata is missing. It is not a
// version, so it must never be displayed as one.
export const UNKNOWN_VERSION = "unknown";

// Mirrors backend/app/core/config.py DEFAULT_BUILD_COMMIT: the backend returns
// this sentinel when no build commit is set. It is not a commit.
export const UNKNOWN_COMMIT = "unknown";

// The backend shortens the commit to 12 characters; the footer shows 7.
export const SHORT_COMMIT_LENGTH = 7;

export interface AppVersionInfo {
  version: string;
  commit: string | null;
}

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Returns the trimmed string, or null when it is not a string, blank or the sentinel. */
function usableText(value: unknown, sentinel: string): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === sentinel ? null : trimmed;
}

/**
 * Fetches the backend version and short commit in one request. Resolves to
 * null when the version cannot be resolved (non-2xx, malformed body, empty
 * string or the unknown sentinel); the commit is null when unusable.
 * A network failure rejects, as in notes.ts; the caller absorbs it.
 */
export async function fetchAppVersion(): Promise<AppVersionInfo | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    return null;
  }

  const body = (await response.json().catch(() => null)) as {
    version?: unknown;
    commit?: unknown;
  } | null;

  const version = usableText(body?.version, UNKNOWN_VERSION);
  if (version === null) {
    return null;
  }

  const commit = usableText(body?.commit, UNKNOWN_COMMIT);
  return {
    version,
    commit: commit === null ? null : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
