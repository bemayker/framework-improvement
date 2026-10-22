// Client for the backend's GET /api/version. Only `version` is read, so extra
// response fields (for example `commit`) are ignored.

import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this sentinel when its package metadata is missing.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the response carries no
 * usable version (missing, empty, non-string, or the backend's "unknown").
 * Rejects on network failure or a non-OK status.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
