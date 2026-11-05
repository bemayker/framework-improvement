import { API_BASE_URL } from "./config";

export type VersionResponse = {
  version: string;
  commit?: unknown;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

/** The backend's own answer when its package metadata is unavailable. */
export const BACKEND_UNKNOWN_VERSION = "unknown";

/** The backend's own answer when it was started without a build commit. */
export const BACKEND_UNKNOWN_COMMIT = "unknown";

/** How many characters of the build commit the footer shows. */
export const SHORT_COMMIT_LENGTH = 7;

function parseShortCommit(commit: unknown): string | null {
  if (typeof commit !== "string" || commit === "" || commit === BACKEND_UNKNOWN_COMMIT) {
    return null;
  }

  return commit.slice(0, SHORT_COMMIT_LENGTH);
}

/**
 * Fetches the backend's version and build commit. Resolves null when the
 * backend reports no usable version (empty or the unknown sentinel); a missing
 * or unusable commit resolves as `commit: null` and keeps the version. Rejects
 * on a failed request or an unexpected body. Extra response fields are ignored.
 */
export async function getBackendVersion(): Promise<BackendVersion | null> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response body");
  }

  if (body.version === "" || body.version === BACKEND_UNKNOWN_VERSION) {
    return null;
  }

  return { version: body.version, commit: parseShortCommit(body.commit) };
}
