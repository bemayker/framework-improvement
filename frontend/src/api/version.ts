// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersion = {
  version: string;
  commit: string | null;
};

// The backend answers with this when its own package metadata or build commit is unset.
const UNKNOWN_VALUE = "unknown";

/**
 * Fetches the running backend's version and build commit. Rejects when the
 * request fails, the status is not OK, or the response carries no usable
 * version string. An unusable commit resolves as null: the version is still
 * worth showing.
 */
export async function getBackendVersion(): Promise<BackendVersion> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "" || version === UNKNOWN_VALUE) {
    throw new Error("Loading the version failed: response carried no version");
  }

  const commit = typeof body?.commit === "string" ? body.commit.trim() : "";

  return {
    version,
    commit: commit === "" || commit === UNKNOWN_VALUE ? null : commit,
  };
}
