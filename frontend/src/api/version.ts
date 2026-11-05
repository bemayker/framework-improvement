import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/** Fetches the backend's version; extra fields in the response are ignored. */
export async function getVersion(): Promise<VersionResponse> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const version = (body as { version?: unknown } | null)?.version;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  return { version };
}
