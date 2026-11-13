// Client for the backend's version endpoint. The base URL is shared with the
// notes client so there is one source for it.
import { API_BASE_URL } from "./notes";

type VersionResponse = { version: string; commit: string };

export type BackendVersion = { version: string; commit: string | null };

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports for a missing version (package metadata) or a
// missing build commit (BUILD_COMMIT unset); one value for both fields.
const UNKNOWN_SENTINEL = "unknown";

function usableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === "" || trimmed === UNKNOWN_SENTINEL ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit. Resolves to null when the
 * response carries no usable version, and to a null commit when only the
 * commit is unusable; rejects on a non-OK status or a network error.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = usableText(body?.version);

  if (version === null) {
    return null;
  }

  return { version, commit: usableText(body?.commit) };
}
