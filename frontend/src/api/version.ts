import { API_BASE_URL } from "./config";

/** Mirrors backend/app/schemas/version.py. */
export type VersionResponse = {
  version: string;
  commit: string;
};

/** What the footer needs: the version, and the short commit when one is usable. */
export type BuildInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

const SHORT_COMMIT_LENGTH = 7;

// The backend reports this for the version when its package metadata is not
// installed and for the commit when BUILD_COMMIT is unset; neither is a real
// value, so both count as unresolved.
const UNRESOLVED_SENTINEL = "unknown";

function isUsableString(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value !== UNRESOLVED_SENTINEL;
}

/**
 * Fetches the backend's build info, or returns null when the version cannot be
 * resolved (network failure, non-OK status, unusable body, or the backend
 * sentinel). The commit is cut to its first 7 characters, or null when unusable.
 * Never throws: an unresolved version is a normal outcome for the footer.
 */
export async function fetchBackendBuildInfo(): Promise<BuildInfo | null> {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;
    if (!isUsableString(version)) {
      return null;
    }
    const commit = body?.commit;
    return {
      version,
      commit: isUsableString(commit) ? commit.slice(0, SHORT_COMMIT_LENGTH) : null,
    };
  } catch {
    return null;
  }
}
