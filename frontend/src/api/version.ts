// Client for the backend's version endpoint (GET /api/version, built by TEST-05,
// extended with the build commit by TEST-09).
// Components never call fetch directly; they go through this module.

import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type BackendVersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the version and build commit the backend reports, rejecting when the
 * version cannot be read. A missing or unusable commit is null, never a
 * rejection, because the version alone is still worth showing.
 */
export async function getBackendVersionInfo(): Promise<BackendVersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string" || body.version === "") {
    throw new Error("Loading the version failed: response has no version");
  }

  const hasUsableCommit =
    typeof body.commit === "string" && body.commit !== "";

  return {
    version: body.version,
    commit: hasUsableCommit ? (body.commit as string) : null,
  };
}
