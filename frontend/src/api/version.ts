import { API_BASE_URL } from "./baseUrl";

// The backend reports this sentinel when its package metadata is missing.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version from GET /api/version.
 *
 * Resolves to null when the backend reports a blank version or its `unknown`
 * sentinel, so callers never display a word that carries no version. Rejects
 * on a network failure, a non-OK status or an unexpected body shape.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { version?: unknown }).version !== "string"
  ) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = (body as { version: string }).version.trim();

  return version === "" || version === UNKNOWN_VERSION ? null : version;
}
