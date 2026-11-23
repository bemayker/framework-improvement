// Client for the backend's version endpoint (GET /api/version). Components
// never call fetch directly, matching the notes client.

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: unknown;
};

/** What the client hands to components: null means "not known". */
export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

/** The value the backend answers when its package metadata is missing. */
const UNKNOWN_VERSION = "unknown";

/** The value the backend answers when BUILD_COMMIT is unset. */
const UNKNOWN_COMMIT = "unknown";

const VERSION_REQUEST_TIMEOUT_MS = 5000;

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string" &&
    (body as { version: string }).version.length > 0
  );
}

/**
 * A bad commit never throws: the version in the same body is still valid, and
 * an older backend may not send a commit at all.
 */
function readCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit === "" || commit === UNKNOWN_COMMIT) {
    return null;
  }
  return commit;
}

/**
 * Fetches the backend's version and build commit. A field is null when the
 * backend reports it as unknown; throws on a network error, a timeout, a
 * non-OK response or a body without a version string.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL, {
    signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return {
    version: body.version === UNKNOWN_VERSION ? null : body.version,
    commit: readCommit(body.commit),
  };
}
