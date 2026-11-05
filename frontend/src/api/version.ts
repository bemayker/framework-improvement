import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
  commit?: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

/**
 * Fetches the backend's version and, when usable, its build commit; a bad
 * commit never rejects the call, and other extra fields are ignored.
 */
export async function getVersion(): Promise<VersionResponse> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const fields = body as { version?: unknown; commit?: unknown } | null;
  const version = fields?.version;
  const commit = fields?.commit;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response shape");
  }

  if (typeof commit === "string" && commit.trim() !== "") {
    return { version, commit };
  }

  return { version };
}
