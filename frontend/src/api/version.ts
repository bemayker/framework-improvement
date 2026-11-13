import { API_BASE_URL } from "./apiBaseUrl";

// Sentinel the backend answers for a version or commit it cannot determine
// (backend/app/services/version_service.py, DEFAULT_BUILD_COMMIT in
// backend/app/core/config.py). It is not a value to display.
const BACKEND_UNKNOWN_SENTINEL = "unknown";

// The backend sends up to 12 commit characters; the footer shows the first 7.
const SHORT_COMMIT_LENGTH = 7;

const VERSION_URL = `${API_BASE_URL}/api/version`;

export interface BackendVersionInfo {
  version: string | null;
  commit: string | null;
}

function usableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN_SENTINEL ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit from GET /api/version.
 *
 * `version` is null when the backend reports no usable one (empty, blank or its
 * "unknown" sentinel). `commit` is cut to its first 7 characters and is null
 * when it is missing, not a string, blank or the "unknown" sentinel, so an older
 * backend without the field still yields its version. Throws on a non-OK
 * response or a body without a string `version`.
 */
export async function getBackendVersionInfo(): Promise<BackendVersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const fields =
    typeof body === "object" && body !== null
      ? (body as { version?: unknown; commit?: unknown })
      : {};

  if (typeof fields.version !== "string") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const commit = usableText(fields.commit);

  return {
    version: usableText(fields.version),
    commit: commit === null ? null : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
