import { API_BASE_URL } from "./config";

export type VersionResponse = { version: string; commit: string };

export type BackendVersion = { version: string; commit: string | null };

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend's answer when its package metadata is missing.
export const UNRESOLVED_BACKEND_VERSION = "unknown";

// Mirrors UNKNOWN_BUILD_COMMIT in backend/app/core/config.py: the backend's
// answer when BUILD_COMMIT is unset or blank.
export const UNRESOLVED_BUILD_COMMIT = "unknown";

/**
 * Fetches the backend's version and build commit. Resolves to null when the
 * backend reports its "unknown" version sentinel; rejects on network errors,
 * non-OK answers and bodies without a non-empty version string. The commit is
 * null when it is missing, empty, not a string or the "unknown" sentinel; a bad
 * commit never rejects.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  if (version === UNRESOLVED_BACKEND_VERSION) {
    return null;
  }

  const commit = body?.commit;
  const usableCommit =
    typeof commit === "string" && commit !== "" && commit !== UNRESOLVED_BUILD_COMMIT;

  return { version, commit: usableCommit ? commit : null };
}
