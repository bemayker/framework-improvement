import { API_BASE_URL } from "./config";

// Only `version` is read: the backend may add fields to this body without
// breaking the client.
export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when its package metadata is missing.
const UNKNOWN_VERSION = "unknown";

/**
 * Fetches the backend's version. Resolves to null when the backend answered
 * but has no usable version; rejects on a network error or a non-OK response.
 */
export async function fetchBackendVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string") {
    return null;
  }

  const trimmed = version.trim();
  return trimmed === "" || trimmed === UNKNOWN_VERSION ? null : trimmed;
}
