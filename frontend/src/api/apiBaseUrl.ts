const DEFAULT_API_BASE_URL = "http://localhost:8010";

/** Single source of the backend base URL, shared by every API client module. */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
