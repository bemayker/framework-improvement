// One source for the API base URL, so the notes and version clients cannot drift apart.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";
