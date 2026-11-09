# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Amended by the newest tracker comment (see Re-Plan Feedback):** the version must come from the backend at runtime through `GET /api/version`, not from `package.json` at build time; the footer's loading and failure states must be decided and recorded; and the backend involvement must be stated in the plan.

## Acceptance Criteria
<!-- Criteria 2 and 3 are restated as amended by the newest tracker comment; criterion 5 is the comment's own requirement. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's `GET /api/version` fetched at runtime (amended: was "frontend package metadata or a build-time variable"), never a string typed into the component and never `frontend/package.json`. A frontend running against a backend of a different version shows the backend's version.
- [ ] 3. When the version cannot be resolved (`/api/version` unreachable, non-OK, malformed, or reporting the backend's own `unknown` sentinel), the footer renders `Task Notes` without a version rather than showing `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. Before the `/api/version` fetch resolves, the footer shows `Task Notes` with no version and no placeholder (the loading state is recorded, not defaulted).

## Re-Plan Feedback
- Comment (tracker, newest): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. [...] This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  - Version source: criterion 2 is amended. The footer fetches `GET /api/version` at runtime through a new client `frontend/src/api/version.ts`; the `package.json` import is removed from `AppFooter.tsx` and from every test and spec that asserted it.
  - "Add a GET /api/version endpoint": **not built, because it already exists on main.** Checked at plan base b95ad3e: `backend/app/routers/version.py` serves `GET /api/version` returning a JSON object with a `version` string, resolved at runtime from installed package metadata (`backend/app/services/version_service.py`, `importlib.metadata.version("task-notes-backend")`, so it reflects `backend/pyproject.toml`, currently `0.1.0`), registered in `backend/app/main.py`, and covered by `backend/tests/integration/test_version_integration.py`. It was delivered by TEST-05, which is one of this item's declared dependencies (map row deps: TEST-04, TEST-05). Building it again would duplicate TEST-05.
  - Backend change, stated explicitly as asked: **this item is no longer frontend-only in behaviour.** At runtime the footer now depends on the backend being reachable from the browser (the same origin and CORS path the notes API already uses). It still changes **no backend file**: the backend half is TEST-05's existing endpoint, consumed as-is. That is why the Backend Plan below reads "No backend changes required" and no `[B]` entry appears in the File Manifest; the dependency is stated here and in Plan Overview rather than being silent.
  - Loading state (decided): the footer renders `Task Notes` alone, no version, no spinner, no placeholder text. Criterion 5.
  - Failure state (decided): the footer renders `Task Notes` alone, identical to loading. It is **not** blank (the app name stays) and it does **not** read `unknown`. Criterion 3.
  - Backend sentinel (decided, an assumption): when the backend answers 200 with `version` equal to `unknown` (its own `UNKNOWN_VERSION` when package metadata is missing), the footer treats it as unresolved and renders `Task Notes` alone, so "a footer reading unknown" never appears by any route. Recorded as an assumption below.
- Comment (tracker, operator note, older): "Reset to to do on 2026-09-07 for measured run 3 ... Note for the revert: TEST-08 changed LandingPage.tsx, which TEST-04 also touched; reverting restores TEST-04's footer assertion as it was." → Not acted on as a change: it is an operator note about reverting earlier runs. Taken into account in two ways: this plan does **not** modify `LandingPage.tsx` at all (the fetch lives in `AppFooter.tsx`), and it does modify TEST-04's footer assertions (`LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts` and TEST-04's UAT scenario and script), because they assert the `package.json` version this item replaces and would otherwise fail.
- Framework "PR opened" notices from earlier runs: not actionable, not acted on.
- Merged since the last plan: n/a (fresh plan, no existing `plan.md` for TEST-08; plan base b95ad3e is current main).

### Assumptions
- A1. `GET /api/version` from TEST-05 is the backend endpoint the comment asks for; its response shape is not changed by this item.
- A2. The backend's `unknown` sentinel is treated as "cannot be resolved" (criterion 3), so the footer never reads `Task Notes vunknown`.
- A3. Display format stays TEST-04's `Task Notes v{version}`; only the source of `{version}` changes.
- A4. One fetch on mount, no retry and no client-side timeout. A hanging request leaves the footer in the loading render, which is identical to the failure render, so the user sees the same footer either way. A timeout is the known follow-up tracked as CHORE-02 (its map row names "fetch timeout" in `frontend/src/api/version.ts`), so it is deliberately out of scope here.
- A5. The base API URL (`VITE_API_BASE_URL` with default `http://localhost:8010`) is moved from `notes.ts` into one shared module so the two clients read it from one source (`coding_standards.md` Section 5, one value, one source). No behaviour change for notes.
- A6. The client reads only the `version` field and ignores any other field, so TEST-09 (which adds the build commit to the same endpoint) does not break this footer.

## Plan Overview
The landing-page footer (`AppFooter`, from TEST-04) stops importing `version` from `frontend/package.json` and instead fetches the running backend's version from the existing `GET /api/version` (TEST-05) once on mount, through a new typed client module. Until the fetch resolves, and whenever it fails or the backend reports `unknown`, the footer shows `Task Notes` alone; on success it shows `Task Notes v{backendVersion}`. Layers: frontend only in code (one new API client, one shared base-URL module, the footer component); the backend endpoint is consumed unchanged, which makes this item depend on the backend at runtime though it edits no backend file. TEST-04's tests, E2E spec and UAT artifacts that asserted the `package.json` version are updated to the backend version. Not a scaffold item.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` so both clients share one source.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and drop its local `DEFAULT_API_BASE_URL` / `API_BASE_URL` constants. No other change.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, lets a network error from `fetch` propagate, throws on an unexpected shape (body not an object, or `version` not a non-empty string). Returns `null` when `version` equals the backend sentinel `unknown` (constant `BACKEND_UNKNOWN_VERSION = "unknown"`, with a comment naming `backend/app/services/version_service.py` `UNKNOWN_VERSION` as its counterpart). Otherwise returns the version string. Reads only `version`. Exported type `VersionResponse = { version: string }`.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `backendVersion: string | null` in state, initial `null`. In a `useEffect` with an empty dependency list, call `fetchBackendVersion()`; on resolve set the state (only while mounted, same `isMounted` guard as `LandingPage.tsx`); on reject leave it `null` (comment: the footer degrades to the app name, it never blocks the page). Render `Task Notes` followed by ` v{backendVersion}` only when `backendVersion` is a non-empty string, so the unresolved render is exactly `Task Notes` with no trailing space or `v`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.** The footer owns its own fetch, so the page component and BUG-04's submit wiring stay untouched.
- Routes: none new.
- State management: local `useState` inside `AppFooter`; no global state.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer keeps TEST-04's existing values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. No new visual state: loading and failure render the same text without the version.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, integration-tested in `backend/tests/integration/test_version_integration.py`). This item depends on that endpoint at runtime and consumes it unchanged; stated here per the tracker comment rather than left implicit. CORS already allows `GET` from the frontend origin (`backend/app/main.py`, `CORS_ORIGINS`).

## API Integration Plan
No external API integration. (The consumed endpoint is this project's own backend; its client follows the same client-layer pattern as `frontend/src/api/notes.ts`.)

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, `application/json`

```json
{"version": "0.1.0"}
```

- The client reads `version` only and ignores additional fields (TEST-09 may add a commit field).
- `{"version": "unknown"}` is the backend's sentinel for "metadata not installed"; the client maps it to `null`.
- Non-OK status, network error or a body without a non-empty string `version`: the client throws; the footer renders `Task Notes` alone.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch`, as `notes.ts` already does, over adding an HTTP library (axios, ky) or a data-fetching library (React Query, SWR), because one GET on mount needs none of their features.
- Footer loading and failure state: chose React's built-in `useState` and `useEffect` (installed dependency `react`) over a state or suspense library, because a single nullable string covers every state.
- Response shape check: chose a few lines of plain TypeScript type narrowing over a schema library (zod), because the shape is one string field.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one constant between two modules, so it is a small module built here (moved from `notes.ts`, not new logic).
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` shared by the notes and version clients
- [A] frontend/src/api/version.ts: typed client for `GET /api/version` (`fetchBackendVersion`), maps the `unknown` sentinel to null, throws on non-OK, network error and bad shape
- [A] frontend/src/api/version.test.ts: unit tests of the version client with `fetch` stubbed (success, sentinel, non-OK, network error, malformed body, extra field ignored, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec, footer shows the backend's version; edge case with `/api/version` aborted shows `Task Notes` alone
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it locally
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount, drop the `package.json` import, render the version only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, absent (rejected), sentinel (null) and loading (pending) paths; drop the `package.json` import
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; replace the `package.json` version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: version step now matches the backend's version, not `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against `backend/pyproject.toml` (or `GET /api/version`), not `frontend/package.json`

No dependency is added or changed, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure (the backend URL variable `VITE_API_BASE_URL` already exists and is already documented in `docker-compose.yml`).

## Testing Strategy
- Unit tests:
  - `frontend/src/api/version.test.ts`, `fetch` stubbed with `vi.stubGlobal` as in `notes.test.ts`: returns `0.1.0` from `{"version": "0.1.0"}` and calls `http://localhost:8010/api/version`; ignores an extra `commit` field; returns `null` for `{"version": "unknown"}`; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response; rejects when `fetch` rejects (network error); throws on `{}` and on `{"version": ""}`; uses `VITE_API_BASE_URL` when set (`vi.stubEnv` plus `vi.resetModules`).
  - `frontend/src/components/AppFooter.test.tsx`, `../api/version` mocked with `vi.mock`: version present (mock resolves `9.9.9`, a value deliberately unlike `frontend/package.json`'s, footer text becomes exactly `Task Notes v9.9.9`); version absent on failure (mock rejects, footer text exactly `Task Notes`, and contains none of `undefined`, `null`, `unknown`, ` v`); version absent on sentinel (mock resolves `null`, text exactly `Task Notes`); loading (mock returns a never-settling promise, text exactly `Task Notes`); landmark and test id preserved; client called once on mount.
  - `frontend/src/components/LandingPage.test.tsx`: mock `../api/version` (resolves `9.9.9`) so the page test never hits the network; the footer assertion checks `Task Notes v9.9.9`.
  - Directory: colocated with the source under `frontend/src/` (the project's established Vitest convention; `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests
- Integration tests: no new integration test. The backend endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (TEST-05); this item adds no router, repository or migration.
  - Directory: backend/tests/integration/
- E2E tests:
  - `e2e/tests/TEST-08_footer_app_version.spec.ts`: (1) on `/`, the footer reads exactly `Task Notes v{backendVersion}`, where `backendVersion` is the `version = "..."` line of `backend/pyproject.toml` read in the spec (the real browser fetch across origins is what only E2E proves); (2) edge case: `page.route("**/api/version", (route) => route.abort())` before navigating, the footer is visible and reads exactly `Task Notes`.
  - `e2e/tests/TEST-04_page_footer.spec.ts`: expected version source switches from `frontend/package.json` to `backend/pyproject.toml`; assertions otherwise unchanged.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (backend unreachable), in plain Given/When/Then without duplicating the E2E interaction assertions.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend's `GET /api/version` at runtime, never typed into the component nor from `package.json` | Unit | Verifying the source needs no navigation or interaction: the component test mocks the client with a value unlike `package.json`'s and asserts that value renders, and the client test asserts the URL called; the endpoint itself is TEST-05's existing integration test |
| 3 | When the version cannot be resolved, the footer renders `Task Notes` without it | Unit | It is a render state of one component (rejected, sentinel), asserted exactly in `AppFooter.test.tsx`; the E2E aborted-request spec is this feature's edge-case spec on top, not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component test, `AppFooter.test.tsx` |
| 5 | Before the fetch resolves, the footer shows `Task Notes` with no version and no placeholder | Unit | A transient render state is only deterministic with a never-settling mocked promise; a browser test would race the real fetch |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, `app-footer` has text `Task Notes v{version from backend/pyproject.toml}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" and the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given `GET /api/version` reports version X, When I open the landing page, Then the footer shows version X and not the frontend package version |
| 3 | Unresolvable version renders `Task Notes` alone | covered at Unit, see Criterion coverage (E2E edge spec aborts `/api/version`) | Given the backend is stopped, When I open the landing page, Then the footer reads "Task Notes" with no version |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then both the present and absent cases pass |
| 5 | Loading state shows `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered yet, When the landing page renders, Then the footer reads "Task Notes" with no placeholder |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root; frontend on `http://localhost:5183`, backend on `http://localhost:8010`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (or whatever `version` is in `backend/pyproject.toml`); note the value.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
3. Read the footer text → it reads exactly `Task Notes v0.1.0`, the value noted in step 1.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as Criterion 1; `frontend/package.json` `version` is `0.0.0` and `backend/pyproject.toml` `version` is `0.1.0` (they differ, which is what makes this check meaningful).
1. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
2. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; it calls `fetchBackendVersion` from `frontend/src/api/version.ts`.
3. Open the browser devtools Network tab and reload `http://localhost:5183/` → one `GET http://localhost:8010/api/version` request with status 200 and body `{"version":"0.1.0"}`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. Run `docker compose stop backend` from the repository root → the backend container stops.
2. Reload `http://localhost:5183/` → the page still renders (heading, note form).
3. Read the footer text → it reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no empty gap after the name.
4. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root → expected `0 failed`; the output lists the AppFooter cases for version present, version absent on failure, version absent on the `unknown` sentinel, and loading.

### Criterion 5: Before the fetch resolves, the footer shows `Task Notes` with no placeholder
Prerequisites: as Criterion 1.
1. Open `http://localhost:5183/`, then in devtools Network set throttling to "Slow 3G" (or block `http://localhost:8010/api/version` with the request-blocking panel to hold it unanswered) and reload → while the request is pending, the footer reads exactly `Task Notes`, with no spinner, no `Loading`, no `...` and no `v`.
2. Remove the throttling or block and reload → the footer reads `Task Notes v0.1.0`.
