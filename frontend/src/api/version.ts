import { API_BASE_URL } from "./apiBaseUrl";

export type VersionInfo = {
  version: string;
  commit: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Fetches the backend's version and build commit from GET /api/version. */
export async function getVersionInfo(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionInfo> | null;

  // The footer renders `commit` directly, so a body without a string one is rejected here.
  if (body === null || typeof body.commit !== "string") {
    throw new Error("Unexpected version response");
  }

  return body as VersionInfo;
}
