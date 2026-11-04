// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type BackendVersion = {
  version: string;
};

// The backend answers with this sentinel when it cannot read its package metadata.
const UNRESOLVED_BACKEND_VERSION = "unknown";

function isBackendVersion(body: unknown): body is BackendVersion {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/**
 * Fetches the backend's version. Returns null when the backend reports none it
 * can stand behind (blank or "unknown"); throws on a non-OK status, a malformed
 * body or a network failure.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  if (!isBackendVersion(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = body.version.trim();
  if (version === "" || version === UNRESOLVED_BACKEND_VERSION) {
    return null;
  }
  return version;
}
