// Single source of the backend base URL, shared by every API client
// (coding_standards.md Section 5: one deployment-dependent value, one source).
// Set VITE_API_BASE_URL to point the frontend at another backend; the default
// is the host port the compose backend publishes.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
