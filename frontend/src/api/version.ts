// Client for the backend's own version endpoint (GET /api/version).

import { API_BASE_URL } from "./baseUrl";

export type VersionResponse = {
  version: string;
};

const VERSION_TIMEOUT_MS = 5000;

/**
 * Fetches the version the backend reports about itself. Rejects on a network
 * error, the timeout, a non-2xx status or a body without a non-empty string
 * `version`, so callers only ever see a usable value or a rejection.
 */
export async function getBackendVersion(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/version`, {
    signal: AbortSignal.timeout(VERSION_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Loading the version failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();
  const version =
    typeof body === "object" && body !== null
      ? (body as Partial<VersionResponse>).version
      : undefined;

  if (typeof version !== "string" || version.trim() === "") {
    throw new Error("Loading the version failed: unexpected response");
  }

  return version;
}
