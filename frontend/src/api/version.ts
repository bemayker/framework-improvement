import { API_BASE_URL } from "./config";

export type VersionResponse = { version: string };

// Mirrors UNKNOWN_VERSION in backend/app/services/version_service.py: the
// backend's answer when its package metadata is missing.
export const UNRESOLVED_BACKEND_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the backend reports its
 * "unknown" sentinel; rejects on network errors, non-OK answers and bodies
 * without a non-empty version string. Other body fields are ignored.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return version === UNRESOLVED_BACKEND_VERSION ? null : version;
}
