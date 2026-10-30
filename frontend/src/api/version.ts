// Client for the backend's GET /api/version. Components never call fetch directly.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const VERSION_URL = `${API_BASE_URL}/api/version`;

const REQUEST_TIMEOUT_MS = 5000;

// The backend answers this when it cannot read its package metadata.
const UNKNOWN_VERSION = "unknown";

// The backend answers this when BUILD_COMMIT is unset or blank.
const UNKNOWN_COMMIT = "unknown";

export interface BackendVersion {
  version: string;
  commit: string | null;
}

/**
 * Resolves to the backend's version and build commit, or null when no usable
 * version can be resolved: network error, timeout, non-2xx, malformed body or
 * the "unknown" sentinel. The commit is null when it is missing, not a string,
 * empty or the "unknown" sentinel. Never rejects, so the footer can render
 * without it.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  try {
    const response = await fetch(VERSION_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    const fields = body as { version?: unknown; commit?: unknown } | null;
    const version = fields?.version;
    const commit = fields?.commit;

    if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
      return null;
    }

    const hasUsableCommit =
      typeof commit === "string" && commit !== "" && commit !== UNKNOWN_COMMIT;

    return { version, commit: hasUsableCommit ? commit : null };
  } catch {
    return null;
  }
}
