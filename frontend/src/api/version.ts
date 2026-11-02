// Client for the backend's version endpoint: components never call fetch
// directly (coding_standards.md Section 4, applied to this project's own backend).

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  // Absent on a backend older than the commit field, so it is optional.
  commit?: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

function hasStringVersion(body: unknown): body is { version: string } {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Fetches the version and build commit the backend reports for itself. */
export async function getBackendVersion(): Promise<VersionResponse> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!hasStringVersion(body)) {
    throw new Error("Loading the version failed: unexpected response body");
  }

  // A missing or malformed commit must never turn a usable version into a failure.
  const { commit } = body as { commit?: unknown };
  return {
    version: body.version,
    commit: typeof commit === "string" ? commit : undefined,
  };
}
