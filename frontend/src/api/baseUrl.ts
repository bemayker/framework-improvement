// Single source of the backend base URL, shared by every API client so the
// VITE_API_BASE_URL default is declared once.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
