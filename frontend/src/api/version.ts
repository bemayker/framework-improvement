// Client for the backend's own version endpoint.
import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend's sentinel for "package metadata missing", which is not a version.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to `null` when the response carries
 * no usable version (missing, empty, non-string or the `unknown` sentinel);
 * rejects on a network error or a non-2xx response.
 */
export async function fetchBackendVersion(): Promise<string | null> {
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
