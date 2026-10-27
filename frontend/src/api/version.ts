import { API_BASE_URL } from "./baseUrl";

type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this sentinel when its package metadata is missing; a
// reader cannot tell it apart from a real version, so it counts as unresolved.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the running backend's version. Returns null when the backend reports
 * none usable (empty or the unknown sentinel); throws on HTTP, network and
 * response-shape failures.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response body");
  }

  const version = body.version.trim();

  return version === "" || version === UNKNOWN_VERSION ? null : version;
}
