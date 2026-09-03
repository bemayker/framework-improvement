// Shared HTTP base for the API client layer: the backend base URL is resolved
// here once so no second client module re-declares the default port
// (coding_standards.md Section 5, one value one source).

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export function requestFailed(operation: string, response: Response): Error {
  return new Error(
    `${operation} failed: ${response.status} ${response.statusText}`,
  );
}
