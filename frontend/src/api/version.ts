import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend's own "could not resolve" answer, which is not a version to show.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves null when the backend reports its
 * unknown sentinel; rejects on network failure, non-OK status or a body
 * without a usable version string.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version =
    typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  return version === UNKNOWN_VERSION ? null : version;
}
