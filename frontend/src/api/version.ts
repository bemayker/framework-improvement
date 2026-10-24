import { API_BASE_URL } from "./baseUrl";

// Mirrors backend/app/schemas/version.py.
export type VersionResponse = {
  version: string;
};

// Mirrors version_service.UNKNOWN_VERSION: the backend answers with this
// sentinel when its distribution metadata is missing, which is the absence of
// a version rather than an answer worth showing.
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Reads the backend's version. Returns null when the backend answered but
 * could not resolve it (blank or the "unknown" sentinel); throws on an HTTP,
 * network or response-shape failure.
 */
export async function getBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response");
  }

  const version = body.version.trim();
  if (version === "" || version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return version;
}
