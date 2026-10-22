// Client for the backend's GET /api/version. Both `version` and `commit` are
// read from the one response.

import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this sentinel when its package metadata or
// BUILD_COMMIT is missing.
const UNKNOWN = "unknown";

function isUsable(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value !== UNKNOWN;
}

/**
 * Fetches the backend's version and build commit. Resolves to null when the
 * response carries no usable version (missing, empty, non-string, or the
 * backend's "unknown"). The commit is null when it is unusable in the same
 * way. Rejects on network failure or a non-OK status.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

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
    commit: isUsable(body.commit) ? body.commit : null,
  };
}
