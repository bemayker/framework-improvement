// The one deployment-dependent value every API client shares, so the notes and
// version clients can never point at different backends.

const DEFAULT_API_BASE_URL = "http://localhost:8010";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
