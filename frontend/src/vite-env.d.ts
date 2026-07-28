/// <reference types="vite/client" />

/**
 * Declares the project's own `VITE_*` variables. Without this, `vite/client`'s
 * `[key: string]: any` index signature types every lookup as `any`, so a typo
 * or a misuse in `src/api/notes.ts` would not be caught at build time
 * (`coding_standards.md` Section 4, "Do not use `any`").
 */
interface ImportMetaEnv {
  /** Base URL of the backend API. See `.env.example`; optional in development. */
  readonly VITE_API_BASE_URL?: string;
}
