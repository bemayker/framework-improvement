// Client for the backend's version endpoint (GET /api/version, built by TEST-05).
// Components never call fetch directly; they go through this module.

import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Fetches the version the backend reports, rejecting when it cannot be read. */
export async function getBackendVersion(): Promise<string> {
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

  return body.version;
}
