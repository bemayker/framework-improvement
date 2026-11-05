import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own "could not resolve" answer: UNKNOWN_VERSION in
// backend/app/services/version_service.py. Treated as no version.
const BACKEND_UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version at runtime. Returns null when the backend
 * reports no usable version (missing, not a string, blank, or "unknown").
 * Throws on a non-OK status; network errors propagate from fetch.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown } | null;
  const version = body?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  if (trimmed === "" || trimmed === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return trimmed;
}
