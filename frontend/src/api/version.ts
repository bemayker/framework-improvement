import { API_BASE_URL } from "./baseUrl";

type VersionResponse = {
  version: string;
  commit?: unknown;
};

export type BackendBuildInfo = {
  version: string | null;
  commit: string | null;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend reports this sentinel when its version or build commit is not
// known; a reader cannot tell it apart from a real value, so it counts as
// unresolved.
const UNKNOWN_SENTINEL = "unknown";

function usableValue(value: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" || trimmed === UNKNOWN_SENTINEL ? null : trimmed;
}

/**
 * Fetches the running backend's version and build commit in one request. Each
 * field is null when the backend reports none usable (missing, non-string,
 * empty or the unknown sentinel); throws on HTTP, network and response-shape
 * failures.
 */
export async function fetchBackendBuildInfo(): Promise<BackendBuildInfo> {
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

  return {
    version: usableValue(body.version),
    commit: typeof body.commit === "string" ? usableValue(body.commit) : null,
  };
}
