import { API_BASE_URL } from "./baseUrl";

// The backend reports this sentinel when its package metadata or build commit is missing.
const UNKNOWN_VALUE = "unknown";
const SHORT_COMMIT_LENGTH = 7;

export interface BackendBuild {
  version: string;
  commit: string | null;
}

function toShortCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }

  const trimmed = commit.trim();

  return trimmed === "" || trimmed === UNKNOWN_VALUE
    ? null
    : trimmed.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's build info from GET /api/version.
 *
 * Resolves to null when the backend reports a blank version or its `unknown`
 * sentinel, so callers never display a word that carries no version. The
 * commit is cut to its first 7 characters and is null when missing,
 * non-string, blank or `unknown`. Rejects on a network failure, a non-OK
 * status or an unexpected body shape.
 */
export async function getBackendBuild(): Promise<BackendBuild | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { version?: unknown }).version !== "string"
  ) {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  const { version: rawVersion, commit } = body as {
    version: string;
    commit?: unknown;
  };
  const version = rawVersion.trim();

  if (version === "" || version === UNKNOWN_VALUE) {
    return null;
  }

  return { version, commit: toShortCommit(commit) };
}
