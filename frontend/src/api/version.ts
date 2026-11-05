import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
};

/** The backend's own answer when its package metadata is unavailable. */
export const BACKEND_UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves null when the backend reports no
 * usable version (empty or the unknown sentinel); rejects on a failed request
 * or an unexpected body. Extra response fields are ignored.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response body");
  }

  if (body.version === "" || body.version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return body.version;
}
