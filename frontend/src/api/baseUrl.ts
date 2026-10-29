// One declaration of the backend origin, shared by every API client so the
// default and the VITE_API_BASE_URL override cannot drift apart.
const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
