import { API_BASE_URL } from "./apiBaseUrl";

export type VersionResponse = {
  version: string;
  commit?: unknown;
};

export type VersionInfo = {
  version: string;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// What the backend reports when BUILD_COMMIT is unset or blank.
const UNKNOWN_COMMIT = "unknown";

/** Fetches the backend's version and build commit from GET /api/version. */
export async function fetchVersion(): Promise<VersionInfo> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  // The commit is optional for the client: an unusable one must not fail the version.
  const rawCommit = body?.commit;
  const commit =
    typeof rawCommit === "string" && rawCommit !== "" && rawCommit !== UNKNOWN_COMMIT
      ? rawCommit
      : null;

  return { version, commit };
}
