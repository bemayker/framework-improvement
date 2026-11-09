import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  // Validated, not trusted: a malformed commit must not reject the request.
  commit?: unknown;
};

export type BackendVersion = {
  version: string;
  shortCommit: string | null;
};

// Counterpart of UNKNOWN_VERSION in backend/app/services/version_service.py:
// the backend's answer when its package metadata is missing.
const BACKEND_UNKNOWN_VERSION = "unknown";

// Counterpart of UNKNOWN_COMMIT in backend/app/services/version_service.py:
// the backend's answer when BUILD_COMMIT is unset.
const BACKEND_UNKNOWN_COMMIT = "unknown";

const SHORT_COMMIT_LENGTH = 7;

const VERSION_URL = `${API_BASE_URL}/api/version`;

function hasVersion(body: unknown): body is VersionResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { version } = body as { version?: unknown };
  return typeof version === "string" && version !== "";
}

function shortenCommit(commit: unknown): string | null {
  if (
    typeof commit !== "string" ||
    commit === "" ||
    commit === BACKEND_UNKNOWN_COMMIT
  ) {
    return null;
  }
  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the running backend's version and short build commit. Resolves to
 * null when the backend reports its own "unknown" version sentinel; rejects on
 * a non-OK response, a network error or an unexpected body shape. A missing or
 * malformed commit resolves with `shortCommit: null` instead of rejecting.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!hasVersion(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  if (body.version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return { version: body.version, shortCommit: shortenCommit(body.commit) };
}
