// Client for the backend's GET /api/version (TEST-05, commit added by TEST-09).
// It never throws: the footer treats every way of not resolving a version the
// same, as null.
import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BuildInfo = {
  version: string;
  commit: string | null;
};

// The backend's own sentinel for "package metadata missing" (version_service.py).
const UNKNOWN_VERSION = "unknown";

// The backend reports a 12-character commit; the footer shows only 7.
const SHORT_COMMIT_LENGTH = 7;

function shortenCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit.trim() === "" || commit === UNKNOWN_VERSION) {
    return null;
  }

  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

export async function getBackendBuildInfo(): Promise<BuildInfo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/version`);

    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;

    if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
      return null;
    }

    return { version, commit: shortenCommit(body?.commit) };
  } catch {
    return null;
  }
}
