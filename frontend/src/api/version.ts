// Client for the backend's version endpoint: components never call fetch
// directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this sentinel when it cannot read its own package
// metadata, which for the footer means "no version to show".
const UNRESOLVED_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the backend answered
 * but has no usable version; rejects when the request fails or is not OK.
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

  return version === "" || version === UNRESOLVED_VERSION ? null : version;
}
