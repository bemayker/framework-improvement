// Client for the backend version endpoint: components never call fetch directly
// (coding_standards.md Section 4).
import { API_BASE_URL } from "./config";

// Mirrors backend/app/services/version_service.py UNKNOWN_VERSION: the backend
// returns this sentinel when its package metadata is missing. It is not a
// version, so it must never be displayed as one.
export const UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the backend version. Resolves to null when the version cannot be
 * resolved (non-2xx, malformed body, empty string or the unknown sentinel).
 * A network failure rejects, as in notes.ts; the caller absorbs it.
 */
export async function fetchAppVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    return null;
  }

  const body: unknown = await response.json().catch(() => null);
  const version = (body as { version?: unknown } | null)?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  return trimmed === "" || trimmed === UNKNOWN_VERSION ? null : trimmed;
}
