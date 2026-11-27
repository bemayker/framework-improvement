// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

// The backend answers with this when its own package metadata is not installed.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the running backend's version. Rejects when the request fails, the
 * status is not OK, or the response carries no usable version string.
 */
export async function getBackendVersion(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "" || version === UNKNOWN_VERSION) {
    throw new Error("Loading the version failed: response carried no version");
  }

  return version;
}
