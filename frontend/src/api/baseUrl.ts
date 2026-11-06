const DEFAULT_API_BASE_URL = "http://localhost:8010";

/** The one place the backend origin is resolved; every API client imports it. */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
