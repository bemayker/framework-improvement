import { API_BASE_URL } from "./config";

type VersionResponse = { version: string };

// The backend reports this sentinel when its distribution metadata is missing
// (backend/app/services/version_service.py). It means the same as "cannot tell".
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).version === "string"
  );
}

/**
 * Reads the backend's version at runtime. Resolves to null when the backend
 * answered without a usable version; rejects on a non-OK status or a network
 * failure. Fields other than `version` are ignored.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    return null;
  }

  const version = body.version.trim();
  if (version === "" || version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
