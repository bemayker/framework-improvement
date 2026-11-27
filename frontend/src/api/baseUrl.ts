// Single source of the backend base URL: every API client reads it from here so
// the deployment-dependent value is configured in exactly one place.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
