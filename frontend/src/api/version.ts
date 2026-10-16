import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this literal when its package metadata is not installed;
// it means "version could not be resolved", so it is treated as a failure.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Rejects whenever no usable version exists
 * (network error, non-OK status, missing/empty value, or the unknown sentinel),
 * so callers have exactly one "absent" path.
 */
export async function fetchVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "" || version === UNKNOWN_VERSION) {
    throw new Error("The backend did not report a usable version");
  }

  return version;
}
