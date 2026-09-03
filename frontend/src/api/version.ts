// Single client layer for the version API: components never call fetch directly
// (coding_standards.md Section 4, applied to this project's own backend).

import { API_BASE_URL, requestFailed } from "./http";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Reads the backend's own version, the single declared source for what the
 * footer shows. Rejects rather than resolving a placeholder when the endpoint
 * is unreachable, answers non-OK, or returns a body without a usable version:
 * the caller renders the failure, and a blank version would hide it.
 */
export async function getVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw requestFailed("Loading the version", response);
  }

  const body = (await response.json()) as Partial<VersionResponse>;
  const version =
    typeof body?.version === "string" ? body.version.trim() : "";

  if (version === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return version;
}
