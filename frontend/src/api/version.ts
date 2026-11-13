// Client for the backend's version endpoint: components never call fetch directly
// (coding_standards.md Section 4, applied to this project's own backend).
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this marker when its package metadata is not installed.
const UNKNOWN_VERSION = "unknown";

/**
 * Resolves to the backend's version string. Rejects whenever no usable version
 * exists: network error, non-OK status, malformed body or the backend's own
 * `unknown` marker.
 */
export async function fetchBackendVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const version =
    typeof body === "object" && body !== null
      ? (body as { version?: unknown }).version
      : undefined;

  if (typeof version !== "string" || version === "" || version === UNKNOWN_VERSION) {
    throw new Error("Loading the version failed: no usable version in the response");
  }

  return version;
}
