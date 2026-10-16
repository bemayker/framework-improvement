import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: string;
};

export type VersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this literal when its package metadata is not installed
// (version) or BUILD_COMMIT is unset (commit); it means "could not be resolved".
// A version of this value is a failure; a commit of this value is simply absent.
const UNKNOWN_SENTINEL = "unknown";

export const COMMIT_DISPLAY_LENGTH = 7;

function toShortCommit(commit: unknown): string | null {
  if (typeof commit !== "string") {
    return null;
  }
  const trimmed = commit.trim();
  if (trimmed === "" || trimmed === UNKNOWN_SENTINEL) {
    return null;
  }
  return trimmed.slice(0, COMMIT_DISPLAY_LENGTH);
}

/**
 * Fetches the backend's version and short commit. Rejects whenever no usable
 * version exists (network error, non-OK status, missing/empty value, or the
 * unknown sentinel). An unusable commit never rejects: it resolves to null.
 */
export async function fetchVersion(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "" || version === UNKNOWN_SENTINEL) {
    throw new Error("The backend did not report a usable version");
  }

  return { version, commit: toShortCommit(body?.commit) };
}
