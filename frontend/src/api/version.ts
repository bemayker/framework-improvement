// Client for the backend's version endpoint. Components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: string;
};

export type BackendVersionInfo = {
  version: string | null;
  commit: string | null;
};

/** Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py. */
export const BACKEND_UNKNOWN_VERSION = "unknown";

/** Mirrors UNKNOWN_COMMIT in backend/app/services/version_service.py. */
export const BACKEND_UNKNOWN_COMMIT = "unknown";

export const SHORT_COMMIT_LENGTH = 7;

const VERSION_URL = `${API_BASE_URL}/api/version`;

function shortCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }

  const trimmed = commit.trim();

  return trimmed === "" || trimmed === BACKEND_UNKNOWN_COMMIT
    ? null
    : trimmed.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's version and build commit in one request. The version
 * is null when the backend reports its unknown sentinel or a blank value; the
 * commit is null when it is missing, blank or the unknown sentinel, and a
 * missing commit never fails the request because the version is still valid.
 * Throws on a network error, a non-OK response or a body without a string
 * `version` field.
 */
export async function getBackendVersionInfo(): Promise<BackendVersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = body.version.trim();

  return {
    version: version === "" || version === BACKEND_UNKNOWN_VERSION ? null : version,
    commit: shortCommit(body.commit),
  };
}
