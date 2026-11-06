const DEFAULT_API_BASE_URL = "http://localhost:8010";

/** The one place the backend origin is declared, shared by every API client. */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
