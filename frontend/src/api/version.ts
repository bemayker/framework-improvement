// Client for the backend's version endpoint: components never call fetch
// directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type AppVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers with this sentinel when it cannot read its own package
// metadata or when no build commit is set, which for the footer means
// "nothing to show".
const UNRESOLVED_VERSION = "unknown";

const SHORT_COMMIT_LENGTH = 7;

/** Trimmed text of a field, or null when it is not a string or has no usable value. */
function usableText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const text = value.trim();
  return text === "" || text === UNRESOLVED_VERSION ? null : text;
}

/**
 * Fetches the backend's version and build commit. Resolves to null when the
 * backend answered but has no usable version; the commit is null when it is
 * unusable. Rejects when the request fails or is not OK.
 */
export async function fetchAppVersion(): Promise<AppVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = usableText(body?.version);

  if (version === null) return null;

  const commit = usableText(body?.commit);
  return {
    version,
    commit: commit === null ? null : commit.slice(0, SHORT_COMMIT_LENGTH),
  };
}
