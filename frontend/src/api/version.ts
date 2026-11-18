// Client for the backend's version endpoint (GET /api/version). Components
// never call fetch directly.
import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

// What the backend reports when its package metadata is missing; it reads like
// a version string, so it is treated as unresolved.
const UNKNOWN_VERSION = "unknown";

/**
 * Resolves the backend's version, or null when the backend reports its
 * "unknown" sentinel. Throws when the request fails or the body is malformed.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: malformed response body");
  }

  return version === UNKNOWN_VERSION ? null : version;
}
