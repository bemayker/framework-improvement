import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_URL = `${API_BASE_URL}/api/version`;

// The backend answers this when its distribution metadata is missing
// (version_service.UNKNOWN_VERSION); it is not a real version to display.
const UNRESOLVED_BACKEND_VERSION = "unknown";

export async function getVersion(): Promise<string | null> {
  const response = await fetch(VERSION_URL);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as Partial<VersionResponse> | null;
  const version = body?.version;

  if (typeof version !== "string" || version === "") {
    throw new Error("Unexpected version response");
  }

  return version === UNRESOLVED_BACKEND_VERSION ? null : version;
}
