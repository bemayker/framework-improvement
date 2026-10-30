// Client for the backend's GET /api/version. Components never call fetch directly.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const VERSION_URL = `${API_BASE_URL}/api/version`;

const REQUEST_TIMEOUT_MS = 5000;

// The backend answers this when it cannot read its package metadata.
const UNKNOWN_VERSION = "unknown";

/**
 * Resolves to the backend's version, or null when it cannot be resolved:
 * network error, timeout, non-2xx, malformed body or the "unknown" sentinel.
 * Never rejects, so the footer can render without it.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  try {
    const response = await fetch(VERSION_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    const version = (body as { version?: unknown } | null)?.version;

    if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
      return null;
    }

    return version;
  } catch {
    return null;
  }
}
