import { API_BASE_URL } from "./config";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this literal when its distribution metadata is missing
// (see backend/app/services/version_service.py); it means "no version".
export const UNRESOLVED_BACKEND_VERSION = "unknown";

// The backend cuts the commit to 12 characters; the footer shows 7.
export const SHORT_COMMIT_LENGTH = 7;

export type BackendVersion = { version: string; commit: string | null };

type VersionBody = { version?: unknown; commit?: unknown };

/**
 * Fetches the backend's version and short build commit from one response.
 * Returns null when the backend did not supply a usable version; the commit is
 * null when it is missing, empty, not a string, or the unknown sentinel.
 * Throws on a non-OK answer and rejects on a network error.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionBody | null;
  const version = body?.version;

  if (
    typeof version !== "string" ||
    version === "" ||
    version === UNRESOLVED_BACKEND_VERSION
  ) {
    return null;
  }

  const rawCommit = body?.commit;
  const commit =
    typeof rawCommit === "string" &&
    rawCommit !== "" &&
    rawCommit !== UNRESOLVED_BACKEND_VERSION
      ? rawCommit.slice(0, SHORT_COMMIT_LENGTH)
      : null;

  return { version, commit };
}
