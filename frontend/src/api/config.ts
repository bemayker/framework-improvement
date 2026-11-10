const DEFAULT_API_BASE_URL = "http://localhost:8010";

/** Backend base URL shared by every API client; overridable per deployment. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
