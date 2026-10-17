import { API_BASE_URL } from "./baseUrl";

type VersionResponse = {
  version: string;
  commit: string;
};

export type AppVersion = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this when its package metadata or build commit is
// missing; showing the word "unknown" in the footer would be misleading, so it
// counts as unresolved.
const UNKNOWN_VALUE = "unknown";

// The backend serves a longer commit; the footer shows the conventional short form.
const SHORT_COMMIT_LENGTH = 7;

function isUsable(value: unknown): value is string {
  return typeof value === "string" && value !== "" && value !== UNKNOWN_VALUE;
}

/**
 * Fetches the backend's version and build commit. Resolves null when the
 * response carries no usable version; `commit` is null when it carries no usable
 * commit, otherwise its first 7 characters. Rejects on a network error or a
 * non-OK response. Other fields are ignored.
 */
export async function fetchAppVersion(): Promise<AppVersion | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (!isUsable(body?.version)) {
    return null;
  }

  const commit = isUsable(body?.commit)
    ? body.commit.slice(0, SHORT_COMMIT_LENGTH)
    : null;

  return { version: body.version, commit };
}
