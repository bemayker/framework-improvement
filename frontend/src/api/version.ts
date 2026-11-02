// Client for the backend's version endpoint: components never call fetch
// directly (coding_standards.md Section 4, applied to this project's own backend).

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Fetches the version the backend reports for itself. */
export async function getBackendVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isVersionResponse(body)) {
    throw new Error("Loading the version failed: unexpected response body");
  }

  return body.version;
}
