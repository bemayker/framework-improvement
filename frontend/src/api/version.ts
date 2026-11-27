// Client for the backend's version endpoint: components never call fetch directly.
import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit: string;
};

export type VersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Fetches the backend's version and build commit; throws when the version cannot be resolved. */
export async function fetchVersion(): Promise<VersionInfo> {
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

  // A missing commit must never turn a good version into a failure.
  const commit = typeof body.commit === "string" ? body.commit : null;

  return { version: body.version, commit };
}
