// Client for the backend's GET /api/version. Components never call fetch
// directly (coding_standards.md Section 4).

import { API_BASE_URL } from "./baseUrl";

export type VersionInfo = {
  version: string;
  commit?: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the version the running backend reports. Reads `version` (required)
 * and `commit` (optional) and ignores any other field the body carries. A bad
 * commit never throws, because a missing commit must not hide the version.
 */
export async function fetchVersion(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as { version?: unknown; commit?: unknown } | null;

  if (typeof body?.version !== "string" || body.version === "") {
    throw new Error("Loading the version failed: no usable version in the response");
  }

  if (typeof body.commit === "string" && body.commit !== "") {
    return { version: body.version, commit: body.commit };
  }

  return { version: body.version };
}
