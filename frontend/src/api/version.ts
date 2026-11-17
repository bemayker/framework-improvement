import { API_BASE_URL } from "./baseUrl";

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers "unknown" when its package metadata is absent
// (backend/app/services/version_service.py UNKNOWN_VERSION). That is not a
// version a person should read in the footer, so it counts as unresolved.
const UNRESOLVED_VERSION_SENTINEL = "unknown";

/**
 * Fetches the backend's version, or null when it reports none usable.
 * Non-OK responses and network errors reject.
 */
export async function getAppVersion(): Promise<string | null> {
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

  if (
    typeof version !== "string" ||
    version === "" ||
    version === UNRESOLVED_VERSION_SENTINEL
  ) {
    return null;
  }

  return version;
}
