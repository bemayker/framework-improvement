// Client for the backend's version endpoint. Components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: string;
};

/** The backend's version and build commit; each is `null` when not reported. */
export type BackendVersion = {
  version: string | null;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers 200 with this value when it cannot resolve its own
// version or build commit; it is the backend saying "unknown", so the client
// reports absence.
const UNRESOLVED_VALUE = "unknown";

// A missing, non-string, blank or sentinel commit is absence, never an error:
// the version must not be lost because of the commit.
function parseCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }
  const trimmed = commit.trim();
  return trimmed === "" || trimmed === UNRESOLVED_VALUE ? null : trimmed;
}

/**
 * Fetches the backend's version and build commit in one request. `version` is
 * `null` when the backend reports it could not resolve one and `commit` is
 * `null` when none is usable; throws on a network failure, a non-OK response
 * or a body without a non-empty string `version`.
 */
export async function fetchBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  return {
    version: version === UNRESOLVED_VALUE ? null : version,
    commit: parseCommit(body?.commit),
  };
}
