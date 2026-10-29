import { API_BASE_URL } from "./config";

// Only `version` and `commit` are read: the backend may add fields to this
// body without breaking the client.
export type VersionResponse = {
  version: string;
  commit: string;
};

// Both fields are null when the backend has no usable value for them.
export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when its package metadata or build commit is missing.
const UNKNOWN_VALUE = "unknown";

function normalise(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" || trimmed === UNKNOWN_VALUE ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit. Each field resolves to null
 * when the backend answered but has no usable value; rejects on a network
 * error or a non-OK response.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  return {
    version: normalise(body?.version),
    commit: normalise(body?.commit),
  };
}
