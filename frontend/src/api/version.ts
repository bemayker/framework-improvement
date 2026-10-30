// Client for the backend's own version endpoint (GET /api/version).

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

const VERSION_TIMEOUT_MS = 5000;

/**
 * Fetches the version and build commit the backend reports about itself.
 * Rejects on a network error, the timeout, a non-2xx status or a body without
 * a non-empty string `version`. A missing, non-string or blank `commit` is not
 * a rejection: it resolves as `null`, so callers only ever see a usable
 * version with an optional commit.
 */
export async function getBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(`${API_BASE_URL}/api/version`, {
    signal: AbortSignal.timeout(VERSION_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const parsed: Partial<VersionResponse> | undefined =
    typeof body === "object" && body !== null
      ? (body as Partial<VersionResponse>)
      : undefined;
  const version = parsed?.version;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  const commit = parsed?.commit;
  const usableCommit =
    typeof commit === "string" && commit.trim() !== "" ? commit : null;

  return { version, commit: usableCommit };
}
