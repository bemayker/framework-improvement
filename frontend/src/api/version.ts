// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py, the value
// the backend returns when its package metadata is missing.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version, or null when the backend reports it as unknown.
 * Throws when the request fails or the body is not the expected shape.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown } | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response body");
  }

  return version === UNKNOWN_VERSION ? null : version;
}
