import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendBuild = {
  version: string;
  commit: string | null;
};

export const SHORT_COMMIT_LENGTH = 7;

// The backend answers this for `version` when its package metadata is missing
// and for `commit` when BUILD_COMMIT is unset; neither is a value a reader can
// use, so both count as unresolved.
const UNKNOWN_SENTINEL = "unknown";

function shortenCommit(commit: unknown): string | null {
  if (
    typeof commit !== "string" ||
    commit === "" ||
    commit === UNKNOWN_SENTINEL
  ) {
    return null;
  }
  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's version and short build commit, or null when the
 * version cannot be resolved. An unusable commit alone gives commit null with
 * the version kept. Every failure collapses to null because the footer has one
 * non-version answer; this function never throws.
 */
export async function fetchBackendBuild(): Promise<BackendBuild | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/version`);
    if (!response.ok) {
      return null;
    }

    const body = (await response.json()) as Partial<VersionResponse> | null;
    const version = body?.version;
    if (
      typeof version !== "string" ||
      version === "" ||
      version === UNKNOWN_SENTINEL
    ) {
      return null;
    }
    return { version, commit: shortenCommit(body?.commit) };
  } catch {
    return null;
  }
}
