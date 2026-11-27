import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this literal when it runs without package metadata.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version, or null when it is empty, malformed or the
 * backend's `unknown` sentinel. Non-2xx responses and network errors throw.
 */
export async function fetchAppVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  return version === "" || version === UNKNOWN_VERSION ? null : version;
}
