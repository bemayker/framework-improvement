import { API_BASE_URL } from "./baseUrl";

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend answers 200 with this value when its package metadata is absent.
const BACKEND_UNKNOWN_VERSION = "unknown";

// Mirrors DEFAULT_BUILD_COMMIT in backend/app/core/config.py: the backend
// answers 200 with this value when BUILD_COMMIT is unset or blank.
const BACKEND_UNKNOWN_COMMIT = "unknown";

const SHORT_COMMIT_LENGTH = 7;

const VERSION_URL = `${API_BASE_URL}/api/version`;

type VersionResponse = { version?: unknown; commit?: unknown };

export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

/** Trims a string field and maps empty and sentinel values to null. */
function normaliseField(value: unknown, unknownSentinel: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" || trimmed === unknownSentinel ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit from one request. Each field
 * is `null` when the backend answered without a usable value; the commit is
 * shortened to its first 7 characters. Rejects on a network error or a
 * non-2xx response.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse | null;
  const commit = normaliseField(body?.commit, BACKEND_UNKNOWN_COMMIT);

  return {
    version: normaliseField(body?.version, BACKEND_UNKNOWN_VERSION),
    commit: commit === null ? null : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
