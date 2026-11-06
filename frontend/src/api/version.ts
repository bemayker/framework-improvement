import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

function isVersionResponse(body: unknown): body is VersionResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { version?: unknown }).version === "string"
  );
}

/** Fetches the backend's version once; the footer is informational, so no retry. */
export async function fetchBackendVersion(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/version`);

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  if (!isVersionResponse(body)) {
    throw new Error("Unexpected version response");
  }

  return body.version;
}
