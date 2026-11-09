import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

// Counterpart of UNKNOWN_VERSION in backend/app/services/version_service.py:
// the backend's answer when its package metadata is missing.
const BACKEND_UNKNOWN_VERSION = "unknown";

const VERSION_URL = `${API_BASE_URL}/api/version`;

function hasVersion(body: unknown): body is VersionResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const { version } = body as { version?: unknown };
  return typeof version === "string" && version !== "";
}

/**
 * Fetches the running backend's version. Resolves to null when the backend
 * reports its own "unknown" sentinel; rejects on a non-OK response, a network
 * error or an unexpected body shape. Only the `version` field is read.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!hasVersion(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return body.version === BACKEND_UNKNOWN_VERSION ? null : body.version;
}
