import { API_BASE_URL } from "./baseUrl";

// Mirrors the backend's UNKNOWN_VERSION sentinel in version_service.py.
export const UNKNOWN_BACKEND_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Asks the backend for its version. Resolves to the version string, or null
 * when it cannot be resolved (network error, non-2xx, malformed body or the
 * backend's unknown sentinel). Never rejects.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_URL);
    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    const version =
      typeof body === "object" && body !== null
        ? (body as { version?: unknown }).version
        : undefined;
    if (typeof version !== "string") {
      return null;
    }

    const trimmed = version.trim();
    if (trimmed === "" || trimmed === UNKNOWN_BACKEND_VERSION) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}
