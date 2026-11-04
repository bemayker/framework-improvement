// The single declaration of the backend base URL: every API client imports it
// from here, so the default and the VITE_API_BASE_URL override live in one place.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
