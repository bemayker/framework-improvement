// Client for the backend's version endpoint: components never call fetch
// directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BuildInfo = {
  version: string;
  commit: string | null;
};

export const COMMIT_DISPLAY_LENGTH = 7;

// The backend answers with this sentinel when its package metadata or its
// BUILD_COMMIT is missing (backend/app/services/version_service.py); it is not
// a value to display for either field.
const UNKNOWN = "unknown";

function isUsable(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value !== UNKNOWN;
}

/**
 * Fetches the backend's build info. Resolves to null when the response carries
 * no usable version (missing, empty, or the "unknown" sentinel), to a null
 * commit when only the commit is unusable, and rejects on a network error or a
 * non-OK status. The commit is cut to its display length.
 */
export async function getBackendBuildInfo(): Promise<BuildInfo | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (!isUsable(body?.version)) {
    return null;
  }

  return {
    version: body.version,
    commit: isUsable(body.commit)
      ? body.commit.slice(0, COMMIT_DISPLAY_LENGTH)
      : null,
  };
}
