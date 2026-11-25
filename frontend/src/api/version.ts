// Client for the backend's GET /api/version (TEST-05, TEST-09), used by the page footer.
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Counterpart of UNKNOWN_VERSION in backend/app/services/version_service.py
// and of DEFAULT_BUILD_COMMIT in backend/app/core/config.py: the backend
// answers it when its package metadata or BUILD_COMMIT is missing, and it must
// never be shown as if it were a version or a commit.
const BACKEND_UNKNOWN_VALUE = "unknown";

export type BackendVersion = {
  version: string;
  commit: string | null;
};

type VersionResponse = {
  version?: unknown;
  commit?: unknown;
};

function usableString(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    value === "" ||
    value === BACKEND_UNKNOWN_VALUE
  ) {
    return null;
  }

  return value;
}

/**
 * Resolves the backend version and build commit, or null when the backend
 * answered without a usable version. The commit is null when it is unusable.
 * Rejects on a non-OK status or a network failure.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse | null;
  const version = usableString(body?.version);

  if (version === null) {
    return null;
  }

  return { version, commit: usableString(body?.commit) };
}
