import { API_BASE_URL } from "./config";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this literal when its distribution metadata is missing
// (see backend/app/services/version_service.py); it means "no version".
export const UNRESOLVED_BACKEND_VERSION = "unknown";

type VersionBody = { version?: unknown };

/**
 * Fetches the backend's version. Returns null when the backend did not supply
 * a usable one; throws on a non-OK answer and rejects on a network error.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionBody | null;
  const version = body?.version;

  if (
    typeof version !== "string" ||
    version === "" ||
    version === UNRESOLVED_BACKEND_VERSION
  ) {
    return null;
  }

  return version;
}
