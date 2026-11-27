import { API_BASE_URL } from "./baseUrl";

// Mirrors the backend's UNKNOWN_VERSION sentinel in version_service.py.
export const UNKNOWN_BACKEND_VERSION = "unknown";

// Mirrors DEFAULT_BUILD_COMMIT in backend/app/core/config.py.
export const UNKNOWN_BUILD_COMMIT = "unknown";

export const SHORT_COMMIT_LENGTH = 7;

export type BackendVersion = { version: string; commit: string | null };

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Cuts a usable commit to its short form; null for anything unusable. */
function shortCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }
  const trimmed = commit.trim();
  if (trimmed === "" || trimmed === UNKNOWN_BUILD_COMMIT) {
    return null;
  }
  return trimmed.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Asks the backend for its version and build commit. Resolves to the version
 * with the 7-character commit (null when the commit is unusable), or to null
 * when the version cannot be resolved (network error, non-2xx, malformed body
 * or the backend's unknown sentinel). Never rejects.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    const fields =
      typeof body === "object" && body !== null
        ? (body as { version?: unknown; commit?: unknown })
        : {};
    if (typeof fields.version !== "string") {
      return null;
    }

    const version = fields.version.trim();
    if (version === "" || version === UNKNOWN_BACKEND_VERSION) {
      return null;
    }
    return { version, commit: shortCommit(fields.commit) };
  } catch {
    return null;
  }
}
