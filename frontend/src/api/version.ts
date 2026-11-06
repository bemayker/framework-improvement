import { API_BASE_URL } from "./config";

type VersionResponse = { version: string };

export type BackendVersion = { version: string; commit: string | null };

// The backend reports this sentinel when its distribution metadata is missing
// (backend/app/services/version_service.py). It means the same as "cannot tell".
const BACKEND_UNKNOWN_VERSION = "unknown";

// Same idea for the build commit: mirrors DEFAULT_BUILD_COMMIT in
// backend/app/core/config.py, served when BUILD_COMMIT is unset or blank.
const BACKEND_UNKNOWN_COMMIT = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).version === "string"
  );
}

/** A usable commit is a non-blank string that is not the backend's sentinel. */
function resolveCommit(body: VersionResponse): string | null {
  const commit = (body as Record<string, unknown>).commit;
  if (typeof commit !== "string") {
    return null;
  }

  const trimmed = commit.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN_COMMIT ? null : trimmed;
}

/**
 * Reads the backend's version and build commit at runtime. Resolves to null
 * when the backend answered without a usable version; the commit alone being
 * unusable only makes `commit` null. Rejects on a non-OK status or a network
 * failure.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    return null;
  }

  const version = body.version.trim();
  if (version === "" || version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return { version, commit: resolveCommit(body) };
}
