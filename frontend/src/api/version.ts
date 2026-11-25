// Client for the backend's GET /api/version: the footer shows the version and
// build commit the running backend reports, never a build-time value from this package.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend's own "could not resolve" answer: it is not a version to show.
const UNKNOWN_VERSION = "unknown";

// The backend's commit sentinel when no build commit is set: not a commit to show.
const UNKNOWN_COMMIT = "unknown";

// The backend serves a 12-character commit; the footer shows the short form.
const SHORT_COMMIT_LENGTH = 7;

/** A missing, non-string, empty or unknown commit is null, never an error. */
function toShortCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit === "" || commit === UNKNOWN_COMMIT) {
    return null;
  }
  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend version and short build commit. Returns null when the
 * backend reports its unknown version sentinel; throws on a non-2xx status or
 * a missing version. A bad commit costs only the commit, never the version.
 */
export async function fetchBackendVersion(): Promise<BackendVersion | null> {
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

  if (body.version === UNKNOWN_VERSION) {
    return null;
  }

  return { version: body.version, commit: toShortCommit(body.commit) };
}
