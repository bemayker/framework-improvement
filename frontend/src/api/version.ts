import { API_BASE_URL } from "./baseUrl";

// The backend answers this when its package metadata is missing
// (backend/app/services/version_service.py).
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

type VersionResponse = { version: unknown };

/**
 * Fetches the backend's version. Returns null when the body carries no usable
 * version (missing, empty, non-string, or the backend's "unknown" sentinel).
 * Throws on a non-OK response; network failures propagate as fetch rejections.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as VersionResponse;
  const { version } = body;

  if (
    typeof version !== "string" ||
    version === "" ||
    version === BACKEND_UNKNOWN_VERSION
  ) {
    return null;
  }

  return version;
}
