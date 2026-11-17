// Single source of the backend base URL for every API client. It is a
// deployment-dependent value, so it is read from the environment
// (VITE_API_BASE_URL) and falls back to the local compose backend.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
