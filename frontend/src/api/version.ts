// Client for the backend's GET /api/version. Components never call fetch
// directly (coding_standards.md Section 4).

import { API_BASE_URL } from "./baseUrl";

export type VersionInfo = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the version the running backend reports. Reads `version` only and
 * ignores any other field the body carries (for example `commit`).
 */
export async function fetchVersion(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown } | null;

  if (typeof body?.version !== "string" || body.version === "") {
    throw new Error("Loading the version failed: no usable version in the response");
  }

  return { version: body.version };
}
