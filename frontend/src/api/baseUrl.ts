// The one source of the backend base URL (TEST-08): every API client reads it
// from here so the deployment-dependent value has a single default.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
