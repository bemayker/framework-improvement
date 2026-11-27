// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Fetches the backend's version string; throws when it cannot be resolved. */
export async function fetchVersion(): Promise<string> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;

  if (typeof body?.version !== "string") {
    throw new Error("Loading the version failed: unexpected response body");
  }

  return body.version;
}
