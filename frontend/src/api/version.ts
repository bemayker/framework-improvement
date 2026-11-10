import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this literal when it cannot read its own package
// metadata (UNKNOWN_VERSION in backend/app/services/version_service.py). It
// means "no version", so the client treats it as unresolved.
const UNKNOWN_VERSION_SENTINEL = "unknown";

/**
 * Fetches the backend's version. Rejects whenever the version cannot be
 * resolved: network failure, non-2xx, a body without a non-empty string
 * `version`, or the backend's "unknown" sentinel.
 */
export async function getBackendVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: response has no version");
  }

  if (version === UNKNOWN_VERSION_SENTINEL) {
    throw new Error("Loading the version failed: backend version is unknown");
  }

  return version;
}
