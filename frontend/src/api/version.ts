// Client for the backend's GET /api/version: the footer shows the version the
// running backend reports, never a build-time value from this package.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own "could not resolve" answer: it is not a version to show.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend version. Returns null when the backend reports its
 * unknown sentinel; throws on a non-2xx status or a malformed body.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string" || body.version === "") {
    throw new Error("Unexpected version response");
  }

  return body.version === UNKNOWN_VERSION ? null : body.version;
}
