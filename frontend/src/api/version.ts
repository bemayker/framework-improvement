// Client for the backend's own version, so the footer shows what is actually
// running rather than a value baked into the frontend bundle (TEST-08).
import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this literal when its package metadata is missing.
export const UNKNOWN_BACKEND_VERSION = "unknown";

/**
 * Fetches the backend version. Resolves to null when the backend answers
 * without a usable version (empty or the unknown sentinel); throws on a
 * non-OK response or a malformed body.
 */
export async function getBackendVersion(): Promise<string | null> {
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

  if (typeof version !== "string") {
    throw new Error("Loading the version failed: response has no string version");
  }

  return version === "" || version === UNKNOWN_BACKEND_VERSION ? null : version;
}
