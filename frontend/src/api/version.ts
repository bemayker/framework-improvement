// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type BackendVersion = {
  version: string;
  commit?: unknown;
};

export type BackendBuildInfo = {
  version: string;
  commit: string | null;
};

// The backend answers with this sentinel when it cannot read a value it reports
// (package metadata for the version, BUILD_COMMIT for the commit).
const UNRESOLVED_SENTINEL = "unknown";

// The footer shows a short commit; the backend already shortened it to 12.
const SHORT_COMMIT_LENGTH = 7;

function isBackendVersion(body: unknown): body is BackendVersion {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

// A commit problem must never hide a good version, so this returns null instead of throwing.
function toShortCommit(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const commit = raw.trim();
  if (commit === "" || commit === UNRESOLVED_SENTINEL) return null;
  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's build info. Returns null when the backend reports no
 * version it can stand behind (blank or "unknown"); the commit is null when it
 * is missing, not a string, blank or "unknown". Throws on a non-OK status, a
 * malformed body or a network failure.
 */
export async function fetchBackendVersion(): Promise<BackendBuildInfo | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  if (!isBackendVersion(body)) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const version = body.version.trim();
  if (version === "" || version === UNRESOLVED_SENTINEL) {
    return null;
  }
  return { version, commit: toShortCommit(body.commit) };
}
