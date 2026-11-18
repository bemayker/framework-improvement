// One source for the backend's base URL: every API client reads it from here so
// the env override and the default can never diverge between clients.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
