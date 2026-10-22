# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Notes: Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete.
>
> Superseded in part by the tracker comment recorded under Re-Plan Feedback: the version is the backend's, fetched at runtime from `GET /api/version`, not the frontend's `package.json`.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. (Read with the tracker comment: the single declared source is the backend's `[project].version` in `backend/pyproject.toml`, served at runtime by `GET /api/version`.)
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: the comment overrides the description and criterion 2's parenthetical. The footer no longer imports `frontend/package.json`; it fetches `GET /api/version` through a new client module `frontend/src/api/version.ts` and renders the backend's version. Decisions, recorded as asked:
  - Loading state (before the fetch resolves): the footer renders `Task Notes` alone: no version, no `v`, no placeholder text, no spinner. The footer element and its `data-testid="app-footer"` are present from the first render, so the page layout does not shift beyond the version text appearing.
  - Failure state (`/api/version` unreachable, non-2xx, or a body without a non-empty string `version`): the footer stays at `Task Notes` alone, i.e. the version is OMITTED, never replaced by `unknown`, `undefined`, `null`, `-` or a trailing `v`. Chosen over rendering `unknown` because criterion 3 says "renders without it", and because the backlog already carries BUG-03 ("Footer sometimes shows 'unknown' instead of the build commit"), which treats a visible `unknown` as a defect.
  - Backend sentinel: `backend/app/services/version_service.py` answers 200 with `{"version": "unknown"}` when the distribution metadata is not installed. The client treats that sentinel exactly like a failure (version absent), because it is the backend saying it could not resolve its version, which is criterion 3's case.
  - No retry and no timeout are added: the footer is non-critical, a failed fetch degrades to the name-only footer, and a fetch timeout is already scoped to the follow-up item CHORE-02 in `feature_map.md`.
- Backend change (assumption, recorded per the comment's last request): the comment asks to ADD `GET /api/version`. It already exists on main at plan base 7273cd4: `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py` (TEST-05), answering `{"version": "<pyproject version>"}`, covered by `backend/tests/integration/test_version_integration.py`. So this item makes NO backend change and the File Manifest carries no `[B]` entry. TEST-09, planned concurrently, extends the same endpoint with a `commit` field; this plan does not touch any backend file TEST-09 would own. The frontend client reads only `version` and ignores any other field, so it works identically whether TEST-09 merges before or after this item. If `GET /api/version` were missing on main the plan would have needed it; it is not.
- Description note "It modifies `LandingPage.tsx`" → not acted on as written: the footer fetches its own version, so `LandingPage.tsx` itself is unchanged. Only `LandingPage.test.tsx` changes, because its footer assertion reads `frontend/package.json`, which is no longer the source. This also narrows the overlap with BUG-04 to a test file.
- Consequence for TEST-04's artifacts: `e2e/tests/TEST-04_page_footer.spec.ts`, `e2e/uat/scenarios/TEST-04_page_footer.feature` and `e2e/uat/scripts/TEST-04_page_footer_uat_script.md` assert the version equals `frontend/package.json`'s `0.0.0`. After this change the footer reads the backend's `0.1.0`, so those assertions become false; they are re-pointed at the backend's version (`backend/pyproject.toml` `[project].version`) and listed in the manifest rather than left to fail.

## Plan Overview
Frontend-only change against an existing backend endpoint. A new API client `frontend/src/api/version.ts` calls `GET {API_BASE_URL}/api/version` and returns the version string, or `null` when the backend reports the `unknown` sentinel. The base URL constant moves out of `notes.ts` into a shared `frontend/src/api/baseUrl.ts` so the two clients read one source (`coding_standards.md` Section 5, one value one source). `AppFooter.tsx` drops its `package.json` import, holds `version: string | null` in state (initially `null`), fetches once on mount, and renders `Task Notes v{version}` when it has a version and `Task Notes` alone otherwise (loading, failure, sentinel). No backend, database, dependency or configuration change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }`; `export async function fetchBackendVersion(): Promise<string | null>`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response (same shape as `notes.ts`) and `Error("Loading the version failed: unexpected response")` when the body has no non-empty string `version`; returns `null` when `version` is the backend sentinel `"unknown"`; otherwise returns the string trimmed. Network errors propagate as the fetch rejection.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`; `useState<string | null>(null)`; `useEffect` with the same `isMounted` guard pattern `LandingPage.tsx` uses, calling `fetchBackendVersion()`, setting the result on resolve and leaving `null` on reject. Render `{APP_NAME}` followed by ` v{version}` only when `version` is a non-empty string, so the absent case is exactly `Task Notes` with no trailing space. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer styling is unchanged from TEST-04: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, CORS already allowing `http://localhost:5183`). The tracker comment's "add a GET /api/version endpoint" is satisfied by that existing endpoint; TEST-09 owns the concurrent `commit` extension.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`, overridable by `VITE_API_BASE_URL`)
- Request: no body, no query parameters.
- Response: 200, `{"version": "0.1.0"}`. After TEST-09 merges the body also carries `"commit"`; this client ignores every field except `version`. `{"version": "unknown"}` is the backend's unresolved sentinel and is rendered as absent.

## Technology Selection
- Version client `frontend/src/api/version.ts`: chose the browser's native `fetch` over a new HTTP dependency (axios or similar), because `fetch` already serves `notes.ts` and covers a single GET.
- Shared base URL `frontend/src/api/baseUrl.ts`: chose moving the existing `import.meta.env` read (Vite's native env, already used) into one module over duplicating the literal in a second client, because two copies of a deployment-dependent value is what `coding_standards.md` Section 5 forbids.
- Loading/failure handling in `AppFooter.tsx`: chose React's own `useState` and `useEffect` over a data-fetching library (react-query, SWR), which this project does not install and a single mount-time fetch does not need.
- Tests: Vitest and Testing Library (installed) for unit and component tests, Playwright (installed) with its native `page.route` for the failure-path spec; no new dependency.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` definition shared by the notes and version clients.
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`.
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed (OK, sentinel, non-OK, malformed body, network rejection, URL from base).
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend's version on `/`; with `/api/version` aborted the footer reads exactly `Task Notes`.
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case.
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it.
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render it when present, omit it when loading, failed or sentinel; drop the `package.json` import.
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version-present, rejected-fetch, sentinel-null and loading paths; drop the `package.json` import.
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of `package.json`'s.
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`.
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now compares against the backend's `backend/pyproject.toml` version.
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 now point at `backend/pyproject.toml` (or `GET /api/version`) instead of `frontend/package.json`.

No dependency is added or changed, so no lockfile changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: no project structure, run configuration, dependency or test infrastructure changes.

## Testing Strategy
- Unit tests: `version.ts` client (stubbed `fetch`: OK returns the string, `"unknown"` returns `null`, non-OK throws with status, body without a string `version` throws, fetch rejection propagates, URL is `{API_BASE_URL}/api/version`, an extra `commit` field is ignored). `AppFooter` component tests with `../api/version` mocked: resolved `"9.9.9"` renders `Task Notes v9.9.9`; rejected renders exactly `Task Notes`; `null` renders exactly `Task Notes`; before resolution (a pending promise) renders exactly `Task Notes`; the text never contains `undefined`, `null`, `unknown` or a trailing `v`. `LandingPage` test updated to the mocked version. Existing `notes.test.ts` must stay green after the base-URL move.
  - Directory: co-located with the code under `frontend/src/` (the project's existing Vitest convention, e.g. `frontend/src/api/notes.test.ts`); `backend/tests/unit/` is not touched.
  - Naming: `{Module}.test.ts(x)`, as the existing frontend tests.
- Integration tests: none added. The only API touched is the existing `GET /api/version`, already covered by `backend/tests/integration/test_version_integration.py`; there is no backend code change to cover.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: footer on `/` shows the backend's version (read from `backend/pyproject.toml`, which differs from the frontend's `0.0.0`, so the spec proves the source); edge case: `page.route("**/api/version", route => route.abort())` then the footer text is exactly `Task Notes`. TEST-04's spec is re-pointed at the backend version.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page. | E2E | — |
| 2 | The version comes from a single declared source, never a string typed into the component (per the comment: the backend's version via `GET /api/version`). | Unit | Verifying it needs no navigation: the component test renders a mocked backend version that differs from `package.json`'s and the client test asserts the `/api/version` URL; criterion 1's E2E spec additionally sees the real backend value. |
| 3 | When the version cannot be resolved, the footer renders without it rather than `undefined`, `null` or an empty gap. | Unit | Verifying it needs no navigation or interaction: it is the component's rendering of a rejected, sentinel or pending fetch, which a mocked client drives deterministically (the E2E edge-case spec repeats it once in the browser). |
| 4 | A component test asserts both paths: version present, and version absent. | Unit | The criterion names the component test itself as the deliverable; `AppFooter.test.tsx` is it. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` contains `Task Notes v` + the version read from `backend/pyproject.toml` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v" and the backend's version |
| 2 | Version comes from a single declared source | covered at Unit, see Criterion coverage | Given the frontend package version is 0.0.0 and the backend's is 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version is omitted | covered at Unit, see Criterion coverage; edge-case spec aborts `/api/version` and expects exactly `Task Notes` | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page.
Prerequisites: the backend is running on `http://localhost:8010` and the frontend on `http://localhost:5183` (for example `docker compose up`).
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}` (possibly with a `commit` field once TEST-09 has merged); note the version value.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
3. Read the footer text → it reads `Task Notes v0.1.0`, i.e. `Task Notes v` followed by exactly the value noted in step 1.

### Criterion 2: The version comes from a single declared source, never a string typed into the component.
Prerequisites: same as Criterion 1.
1. Open `frontend/package.json` and read the `version` field → it is `0.0.0`.
2. Open `backend/pyproject.toml` and read `[project].version` → it is `0.1.0`.
3. Open `http://localhost:5183/` and read the footer → it shows `0.1.0` (the backend's), not `0.0.0` (the frontend's).
4. Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and for `package.json` → neither appears; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it.
Prerequisites: the frontend is running on `http://localhost:5183`; the backend is stopped (for example `docker compose stop backend`), so `http://localhost:8010/api/version` does not answer.
1. Open `http://localhost:5183/` → the landing page renders with the heading and the note form.
2. Read the footer text → it reads exactly `Task Notes`, with no `v`, no trailing space, and no `undefined`, `null` or `unknown`.
3. Start the backend again (`docker compose start backend`) and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`.
4. In the browser developer tools, Network tab, throttle to "Slow 3G" and reload `/` → while `/api/version` is pending the footer reads `Task Notes` alone, then `Task Notes v0.1.0` appears when the request completes.

### Criterion 4: A component test asserts both paths: version present, and version absent.
This criterion is verified by running tests, not through the UI.
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test names include a version-present case and version-absent cases (rejected fetch, `unknown` sentinel, pending fetch).
