// Client for the backend's version endpoint. Components never call fetch
// directly (coding_standards.md Section 4).
import { API_BASE_URL } from "./config";

/** Only the field this client reads; extra fields the backend adds are ignored. */
export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this when its package metadata is missing; it means the
// version could not be resolved, so it is treated like a failure.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the payload carries no
 * usable version (missing, empty, or the backend's `unknown` sentinel) and
 * rejects on a network error or a non-OK response.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const { version } = (await response.json()) as Partial<VersionResponse>;

  if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
