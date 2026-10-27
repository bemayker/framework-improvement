import { API_BASE_URL } from "./baseUrl";

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend answers 200 with this value when its package metadata is absent.
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

type VersionResponse = { version?: unknown };

/**
 * Fetches the backend's version. Resolves `null` when the backend answered
 * without a usable version; rejects on a network error or a non-2xx response.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse | null;
  const version = body?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  return trimmed === "" || trimmed === BACKEND_UNKNOWN_VERSION ? null : trimmed;
}
