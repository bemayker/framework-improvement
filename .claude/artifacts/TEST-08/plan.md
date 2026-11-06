# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> ## What
>
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> ## Acceptance criteria
>
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the tracker comment:** that source is the backend, read at runtime from `GET /api/version`, not `frontend/package.json` at build time; a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (request failed, backend unreachable, non-OK status, unexpected response shape, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) Before `/api/version` resolves, the footer shows a recorded loading state: the app name alone, `Task Notes`, with no version and no placeholder text.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. ..." → Addressed by: the footer now reads the version at runtime from `GET /api/version` through a new client `frontend/src/api/version.ts`; the `package.json` import is removed from `AppFooter.tsx` and its tests. Criterion 2 is rewritten above to the comment's source, since a comment overrides the description where the two disagree.
- Comment (tracker), same comment, "Add a GET /api/version endpoint": → Addressed by: **no backend change, and this is stated rather than left to the manifest.** The endpoint already exists on `main`: TEST-05 (a declared dependency of this item, done) shipped `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<[project].version of backend/pyproject.toml>"}` via `importlib.metadata`, covered by `backend/tests/integration/test_version_integration.py`. Adding a second one would be duplicate work. The comment's concern, that this turns a frontend-only item into one with a backend dependency, is real and recorded: TEST-08 now **depends at runtime on the backend's `/api/version`** (and on CORS allowing the frontend origin, which `backend/app/main.py` already configures for GET), even though it edits no backend file.
- Comment (tracker), same comment, "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers": → Addressed by: decided, neither. **Loading:** the footer renders `Task Notes` (app name only; no version, no `v`, no "loading" text). **Failure** (network error, unreachable backend, non-OK status, a body whose `version` is not a non-empty string): the footer renders `Task Notes`, the same text. **Backend sentinel:** the backend answers `{"version": "unknown"}` when its package metadata is missing (`version_service.UNKNOWN_VERSION`); the footer treats that as unresolved and renders `Task Notes`, never `Task Notes vunknown`. Reason: criterion 3 already says "renders without it" when unresolved, the footer is never blank because the app name always shows, and one rendering for every unresolved state avoids a loading-to-failure text flicker. Recorded as criterion 5 and in criterion 3.
- Comment (tracker), same comment, "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan": → Addressed by: the Backend Plan below says it explicitly; the File Manifest carries no `[B]` entry because the backend change was already delivered by TEST-05.
- Assumption (no comment covers it): no timeout and no retry on the footer request. A hung request leaves the footer in the loading rendering, which is identical to the failure rendering, so nothing visible depends on a timeout; a retry would add load for a cosmetic element. Recorded here rather than defaulted.
- Assumption: TEST-09 (planned concurrently in this run) may add a `commit` field to the `/api/version` response. The client reads only `version` and ignores any other field, so the two items stay disjoint.
- Merged since the last plan: n/a (fresh plan, branched from current main 27689b4).

## Plan Overview
Frontend-only change against an existing backend endpoint. A new typed API client `frontend/src/api/version.ts` fetches `GET {API_BASE_URL}/api/version` and returns the version string, or `null` when the body does not carry a usable version. `AppFooter.tsx` calls it once on mount, holds `string | null` state, and renders `Task Notes v{version}` when resolved and `Task Notes` otherwise. The API base URL resolution, today private to `notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). `LandingPage.tsx` is **not** modified: the footer owns its own fetch, which keeps this item off the note-form side of the page that BUG-04 will edit. Existing tests and the TEST-04 E2E spec and UAT artifacts that assert the `package.json` version are updated to the backend source.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string | null>`. Fetches `${API_BASE_URL}/api/version`; throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response (same shape as `notes.ts`); network errors propagate as the fetch rejection. On OK, parses JSON and returns `body.version` only when it is a non-empty string other than the backend sentinel `"unknown"` (constant `BACKEND_UNKNOWN_VERSION`, with a one-line comment naming `backend/app/services/version_service.py` as its origin); otherwise returns `null`. Response type `type VersionResponse = { version: unknown }` narrowed at runtime, no `any`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; `useState<string | null>(null)`; `useEffect` calls `getBackendVersion()` once, sets the result, and on rejection sets `null`, guarded by an `isMounted` flag as `LandingPage.tsx` does. Render: `{APP_NAME}` always, then ` v{version}` only when `version` is a string, so there is no trailing space, `v`, `undefined` or `null`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter`; no context, no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept as is: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required. **Stated explicitly per the tracker comment:** the comment asks for a `GET /api/version` endpoint, which turns the description's frontend-only item into one that needs a backend; that endpoint already exists on `main`, shipped by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), so this item consumes it and edits no backend file. Its source is `[project].version` in `backend/pyproject.toml` (currently `0.1.0`), resolved through `importlib.metadata`; it answers 200 without a database. CORS already allows GET from `CORS_ORIGINS` (default `http://localhost:5183`).

## API Integration Plan
No external API integration. (The only API consumed is this project's own backend, through the client layer above.)

## API Contract
- Method: GET
- URL: `/api/version` (on `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 with JSON `{"version": "0.1.0"}`. The client reads `version` only and ignores any other field (TEST-09 may add `commit`). `{"version": "unknown"}` is the backend's unresolved sentinel and maps to `null`.
- Errors the client handles: network failure or unreachable backend (fetch rejects, footer shows `Task Notes`), non-OK status (client throws, footer shows `Task Notes`), unexpected shape such as a missing, non-string or empty `version` (client returns `null`, footer shows `Task Notes`). No retry and no timeout, per Re-Plan Feedback.

## Technology Selection
- Version request: chose the browser's native `fetch` over adding an HTTP library, because `fetch` is already what `notes.ts` uses and covers a single GET.
- Footer state and load: chose React's built-in `useState` and `useEffect` over a data-fetching library (none is installed), because one request on mount needs nothing more.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one project constant between two modules, so it is a three-line module extracted from `notes.ts` rather than a second copy of the env lookup.
- Response validation: chose a `typeof` check over a schema library (none is installed), because the body has one field.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: typed client for `GET /api/version`, returning the version string or `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs, footer shows the version the backend answered, and footer shows `Task Notes` alone when `/api/version` is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version through `getBackendVersion()` on mount; render `Task Notes v{version}` when resolved and `Task Notes` when loading or unresolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the loading, resolved, rejected and sentinel paths
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and replace the `package.json` version assertion in the footer test with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` version with the version captured from the page's own `/api/version` response, so TEST-04's specs stay true
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now matches the backend's `GET /api/version` instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare the footer to `GET /api/version` instead of `frontend/package.json`

No lockfile changes: no dependency is added or removed. `README.md` and `docs/DEVELOPMENT.md` need no edit: no project structure, run configuration, dependency or test infrastructure changes, and `docs/DEVELOPMENT.md` already documents the footer reading `GET /api/version` at runtime with the `Task Notes`-only rendering for pending, failed and `unknown`, which is exactly this plan's behaviour. `frontend/src/components/LandingPage.tsx` is deliberately not modified (the footer fetches for itself), keeping it free for BUG-04.

## Testing Strategy
- Unit tests (Vitest, frontend):
  - `frontend/src/api/version.test.ts`, `fetch` stubbed as in `notes.test.ts`: returns the version from an OK body and calls `http://localhost:8010/api/version`; ignores extra fields (`{"version": "0.1.0", "commit": "abc"}` returns `0.1.0`); returns `null` for `{"version": "unknown"}`, for `{"version": ""}`, for `{}` and for `{"version": 3}`; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response; rejects when `fetch` rejects; uses `VITE_API_BASE_URL` when configured (`vi.stubEnv` plus `vi.resetModules`, asserting the resolved URL, not the default literal).
  - `frontend/src/components/AppFooter.test.tsx`, `../api/version` mocked: version present (`9.9.9` mocked, deliberately not the `package.json` value) renders `Task Notes v9.9.9`; loading (a never-resolving promise) renders exactly `Task Notes`; rejected renders exactly `Task Notes`; `null` renders exactly `Task Notes`; each absent path asserts the text content equals `Task Notes` (so no `undefined`, `null`, `unknown`, trailing `v` or trailing space); landmark and test id kept.
  - `frontend/src/components/LandingPage.test.tsx`: footer test asserts the mocked backend version.
  - Directory: co-located `frontend/src/**/*.test.ts(x)` (the frontend's existing convention; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, as the existing frontend tests
- Integration tests: no new backend integration test; the endpoint and its pyproject-sourced value are already covered by `backend/tests/integration/test_version_integration.py`, which this item does not change.
  - Directory: backend/tests/integration/
- E2E tests (Playwright): `TEST-08_footer_app_version.spec.ts` captures the page's own `/api/version` response with `page.waitForResponse` (no hardcoded API host or port) and asserts the footer contains `Task Notes v{that version}`; edge-case spec aborts `**/api/version` with `page.route` and asserts the footer text is exactly `Task Notes`. `TEST-04_page_footer.spec.ts` switches to the captured version the same way.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | Single declared source, the backend's `GET /api/version` at runtime, never typed into the component | Unit | verifying it needs no navigation or interaction: `version.test.ts` asserts the client reads `/api/version` and `AppFooter.test.tsx` renders a mocked `9.9.9` that is not the `package.json` value; the backend's pyproject source is already covered by `test_version_integration.py` |
| 3 | Unresolved version renders the footer without it (no `undefined`, `null`, `unknown` or gap) | Unit | verifying it needs no navigation or interaction: it is a rendering rule over the client's rejected, `null` and sentinel outcomes, asserted on exact text content; the E2E abort spec is an additional edge check, not the covering tier |
| 4 | A component test asserts both paths, version present and absent | Unit | the criterion names the component test itself as its evidence |
| 5 | Loading state renders `Task Notes` alone | Unit | verifying it needs no navigation or interaction: a never-resolving mocked client holds the pending state deterministically, which a browser cannot do without a hardcoded wait |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Load `/`, capture the `/api/version` response, assert footer contains `Task Notes v{version}` | Given the app and backend are running, When I open the landing page, Then the footer reads `Task Notes v` followed by the version the backend reports |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports `0.1.0` and `frontend/package.json` says `0.0.0`, When I open the landing page, Then the footer shows `0.1.0` |
| 3 | Unresolved renders without it | covered at Unit, see Criterion coverage (edge spec aborts `/api/version`) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly `Task Notes` |
| 4 | Component test, both paths | covered at Unit, see Criterion coverage | Given the frontend tests, When I run the AppFooter tests, Then they pass with 0 failed |
| 5 | Loading state | covered at Unit, see Criterion coverage | Given the version request is still pending, When the page renders, Then the footer reads `Task Notes` with no placeholder |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d --build` from the repo root (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open http://localhost:8010/api/version in a browser tab → the page shows JSON with `"version": "0.1.0"` (note the value; it is `[project].version` of `backend/pyproject.toml`).
2. Open http://localhost:5183/ → the landing page shows the `Task Notes` heading, the note form and the note list.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, the same version as step 1.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: same running stack as Criterion 1.
1. Open `frontend/package.json` in an editor → its `version` field reads `0.0.0`.
2. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, the backend's value, not `0.0.0`.
3. Open the browser DevTools, Network tab, reload http://localhost:5183/ → a GET request to `http://localhost:8010/api/version` appears with status 200; its response body carries `"version": "0.1.0"`.
4. Search the component source: open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: same running stack as Criterion 1.
1. Run `docker compose stop backend` from the repo root → the command reports the backend container stopped.
2. Open http://localhost:5183/ (hard reload) → the page still renders the heading and note form.
3. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap.
4. Run `docker compose start backend`, wait for http://localhost:8010/api/version to answer, reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root → the run lists the version-present and the version-absent (rejected, `null`, loading) tests in `AppFooter.test.tsx` and the client tests in `version.test.ts`, and reports 0 failed.

### Criterion 5: Before the request resolves, the footer shows the app name alone
Prerequisites: same running stack as Criterion 1, Chrome.
1. Open DevTools on http://localhost:5183/, Network tab, right-click any request and choose Block request URL, then edit the pattern to `*/api/version` → request blocking is enabled for that URL.
2. Reload the page → the footer reads exactly `Task Notes` (the request never succeeds, which is the same rendering as the pending state).
3. The pending state itself is too short to see on a local stack; it is held deterministically by the `AppFooter.test.tsx` loading test run in Criterion 4, which must report 0 failed.
4. Untick request blocking and reload → the footer reads `Task Notes v0.1.0`.
