// Client for the backend's version endpoint. The base URL is shared with the
// notes client so there is one source for it.
import { API_BASE_URL } from "./notes";

type VersionResponse = { version: string };

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when its package metadata is missing.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the response carries
 * no usable version; rejects on a non-OK status or a network error.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  return trimmed === "" || trimmed === UNKNOWN_VERSION ? null : trimmed;
}
