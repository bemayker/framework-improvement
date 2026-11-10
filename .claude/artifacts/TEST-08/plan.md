# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The tracker comment recorded under Re-Plan Feedback amends criteria 1 to 3 and the Notes; the criteria below are the amended ones.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page, and that version is the **backend's** version, fetched at runtime from `GET /api/version` (a frontend built against an older backend shows the backend's version, not its own).
- [ ] 2. The version comes from a single declared source, the backend package metadata (`[project].version` in `backend/pyproject.toml`, served by `GET /api/version`), never a string typed into the component and no longer `frontend/package.json`.
- [ ] 3. When the version cannot be resolved (fetch still pending, `/api/version` unreachable, non-OK, malformed body, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap. Loading and failure states are decided and recorded below.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  - **Source of the version:** the comment overrides criterion 2's "frontend package metadata or a build-time variable" and the Notes' "Frontend only". The footer now fetches `GET /api/version` on mount through a new client module `frontend/src/api/version.ts`; the `import { version } from "../../package.json"` in `AppFooter.tsx` is removed.
  - **The backend change, stated explicitly:** this item is **no longer frontend-only in its runtime dependency**, but it needs **no backend code change**. `GET /api/version` already exists on main: TEST-05 (a declared dependency of this item) shipped `backend/app/routers/version.py`, `backend/app/schemas/version.py` and `backend/app/services/version_service.py`, registered in `backend/app/main.py`, returning `{"version": "<[project].version of backend/pyproject.toml>"}` via `importlib.metadata`, with integration coverage in `backend/tests/integration/test_version_integration.py`. Read on c6196fa. Adding the endpoint again would duplicate delivered work, so the Backend Plan says "No backend changes required" and the File Manifest carries no `[B]` entry. CORS already allows `GET` from `http://localhost:5183` (`backend/app/main.py`, `backend/app/core/config.py`).
  - **Loading state (decided):** before the fetch settles the footer renders `Task Notes` alone: the app name, no ` v`, no placeholder text, no spinner. Chosen over `Task Notes v…` or `loading` because any placeholder reads as a value, and a placeholder followed by nothing on failure would be the empty gap criterion 3 forbids. The footer element is always present (never a blank footer).
  - **Failure state (decided):** if `/api/version` is unreachable (network or CORS error), answers non-OK, returns a body without a non-empty string `version`, or returns the backend's sentinel `unknown` (what `version_service.get_app_version` returns when the distribution metadata is missing), the footer renders `Task Notes` alone, identical to the loading state. **Not a blank footer and not `unknown`:** the app name stays (the footer still identifies the app), and `unknown` is not shown because criterion 3 says an unresolved version is omitted, and the backend's `unknown` is precisely an unresolved version. Assumption recorded: treating the backend sentinel as unresolved couples the client to the literal `unknown`; it is named once as a constant in `frontend/src/api/version.ts` with a comment pointing at `backend/app/services/version_service.py`.
  - **No retry and no timeout** are added (not asked for; CHORE-02 is the follow-up that owns a fetch timeout). Consequence, recorded: a backend that hangs leaves the footer in the loading state, which is visually the failure state, so the user never sees a wrong value.
- Comment (tracker): operator reset note of 2026-09-07 → not acted on because it is a sandbox-reset notice, not feedback on the feature.
- Comment (tracker): framework PR notices from earlier runs → not acted on because they are lifecycle notices, not feedback on the feature.
- Merged since the last plan: n/a (fresh plan, no earlier plan on this branch; plan base c6196fa).

## Plan Overview
Frontend-only code change with a runtime dependency on the existing backend endpoint `GET /api/version` (TEST-05). A new API client module fetches the backend version; `AppFooter` calls it on mount and renders `Task Notes v{version}` once resolved, and `Task Notes` alone while loading or on any failure. The API base URL, today defined inside `frontend/src/api/notes.ts`, moves to one shared module so both clients read the same configured value (`coding_standards.md` Section 5: one value, one source). `LandingPage.tsx` is **not** modified: it already renders `<AppFooter />`, and the fetch lives inside the footer. Existing tests and UAT artifacts that assert the frontend `package.json` version are updated to the backend version.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim out of `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` instead of defining it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. `fetch(`${API_BASE_URL}/api/version`)`; throws `Error("Loading the version failed: {status} {statusText}")` on non-OK (same shape as `notes.ts`'s `requestFailed`); returns `null` when the body has no non-empty string `version` or when it equals the sentinel `UNRESOLVED_BACKEND_VERSION = "unknown"`; otherwise returns the string. A network error propagates as the rejected `fetch` promise.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `const [version, setVersion] = useState<string | null>(null)`; `useEffect` on mount calls `fetchBackendVersion()`, sets the result, and on rejection leaves `null`; an `isMounted` guard as in `LandingPage.tsx`. Render: `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`. `APP_NAME` and `footerStyle` unchanged.
- Routes: none (landing page `/` only).
- State management: local `useState` in `AppFooter`; no global state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing styling unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version is plain text inside the same footer, no separate styling. Loading and failure states render the app name only, as recorded under Re-Plan Feedback.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05): router `backend/app/routers/version.py`, schema `backend/app/schemas/version.py`, service `backend/app/services/version_service.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. The tracker comment asks for this endpoint; it is consumed, not re-created (see Re-Plan Feedback).

## API Integration Plan
No external API integration. (The only API consumed is this project's own backend, specified under API Contract.)

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `${VITE_API_BASE_URL ?? "http://localhost:8010"}/api/version`)
- Request: no body, no query parameters
- Response: `200 application/json`, `{"version": "0.1.0"}` (the value is `[project].version` of `backend/pyproject.toml`; the backend returns `{"version": "unknown"}` when its distribution metadata is not installed, which the frontend treats as unresolved). Existing contract, unchanged by this item.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser-native `fetch` over an HTTP library, because `fetch` is already what `notes.ts` uses and covers a single GET; no new dependency.
- Shared base URL (`frontend/src/api/config.ts`): chose a plain exported constant over any config library, because Vite's built-in `import.meta.env` already resolves `VITE_API_BASE_URL`.
- Footer state: chose React's built-in `useState` and `useEffect` (installed) over a data-fetching library, because one fetch on mount needs no cache or retry.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source of `API_BASE_URL` (from `VITE_API_BASE_URL`, default `http://localhost:8010`), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, with the `unknown` sentinel mapped to `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests of the version client with `fetch` stubbed (resolved version, non-OK throws, network error rejects, missing or empty `version` returns null, `unknown` returns null, `VITE_API_BASE_URL` honoured)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the footer showing the backend version, and the edge case where `/api/version` is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios per acceptance criterion plus one edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script that build-feature writes alongside it

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of defining it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render `Task Notes v{version}` when resolved, `Task Notes` alone while loading or on failure; remove the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, version absent on rejection, absent on `null`, absent while pending, and no `undefined`/`null`/`unknown` text or trailing ` v`
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and replace the `package.json` version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`, since the footer now shows the backend version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step names `backend/pyproject.toml` (served by `GET /api/version`) instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against `backend/pyproject.toml` instead of `frontend/package.json`

`frontend/src/components/LandingPage.tsx` is not modified: it already renders `<AppFooter />` and the fetch lives in the footer. No dependency changes, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: no project structure, run configuration, dependency or test infrastructure change (the new modules sit in the existing `frontend/src/api/` directory, and `VITE_API_BASE_URL` is already documented through `docker-compose.yml`).

## Testing Strategy
- Unit tests: Vitest, frontend. `version.test.ts` exercises the real client with `fetch` stubbed (pattern of `notes.test.ts`): `fetchBackendVersion_returns_the_backend_version`, non-OK throws with status, rejected fetch rejects, body without `version` or with `""` returns null, `"unknown"` returns null, `VITE_API_BASE_URL` override is used. `AppFooter.test.tsx` mocks `../api/version` with `vi.mock`: version present (`"9.9.9"` shows `Task Notes v9.9.9` and `app-version`), version absent on rejection, absent on `null`, absent while the promise is pending, and in every absent case the footer text is exactly `Task Notes` (no `undefined`, `null`, `unknown`, trailing ` v`). The existing contentinfo landmark test stays. `LandingPage.test.tsx` mocks the version client so it no longer reads `package.json`. `notes.test.ts` stays green unchanged after the base-URL move.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`, the existing frontend convention; `backend/tests/unit/` holds backend tests only)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx` as existing
- Integration tests: no new integration tests. No backend code changes; `GET /api/version` is already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST), which this plan relies on for criterion 2's backend half.
  - Directory: `backend/tests/integration/`
- E2E tests: `TEST-08_footer_app_version.spec.ts`: (1) on `/`, `app-footer` contains `Task Notes v{version}` where `{version}` is read from `backend/pyproject.toml`, and when that differs from `frontend/package.json`'s version (today 0.1.0 vs 0.0.0) the footer does not contain the frontend one; (2) edge case: `page.route("**/api/version", route => route.abort())` before `goto("/")`, then the footer text is exactly `Task Notes` and contains none of `undefined`, `null`, `unknown`. Wait on the `/api/version` response (exact pathname match, as `TEST-03_simple_note_form.spec.ts` does for notes, since Vite serves `src/api/version.ts` from a URL containing the same substring), never a fixed timeout. `TEST-04_page_footer.spec.ts` is updated to the backend version.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Footer renders the backend's runtime version on the landing page | E2E | — |
| 2 | Version comes from one declared source (backend metadata via `GET /api/version`), never typed into the component | Unit | Verifying it needs no navigation or interaction: the component test proves the footer shows whatever the client returns (`9.9.9`, not a literal or `package.json`), and the backend half is already covered by `test_version_integration.py` |
| 3 | Unresolved version (pending, unreachable, non-OK, malformed, `unknown`) renders the footer without it, no `undefined`/`null`/`unknown`/gap | Unit | Verifying it needs no navigation or interaction: each failure mode is a client or render branch driven by a mocked promise; the E2E edge-case spec additionally checks the unreachable path in the browser |
| 4 | A component test asserts both paths: version present and version absent | Unit | The criterion is itself about the component test in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the backend's runtime version | Open `/`, await the `/api/version` response, assert `app-footer` contains `Task Notes v` plus the `backend/pyproject.toml` version and not the frontend `package.json` version | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend version |
| 2 | Single declared source | covered at Unit, see Criterion coverage | Given the backend version in backend/pyproject.toml, When I open the landing page, Then the footer version equals it |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage (E2E edge-case spec aborts `/api/version`) | Given the backend is unreachable, When I open the landing page, Then the footer shows "Task Notes" with no version and no "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the backend's runtime version on the landing page
Prerequisites: the stack is up with `docker compose up -d --build` from the repo root (db, backend on http://localhost:8010, frontend on http://localhost:5183). `backend/pyproject.toml` reads `version = "0.1.0"`; `frontend/package.json` reads `"version": "0.0.0"`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` → the landing page shows the heading `Task Notes`, the note form and, at the bottom, the footer.
3. Read the footer → it reads `Task Notes v0.1.0` (the backend's version), not `Task Notes v0.0.0` (the frontend's).
4. Open the browser devtools Network tab and reload `/` → one request to `http://localhost:8010/api/version` with status 200.

### Criterion 2: The version comes from a single declared source
Prerequisites: as for Criterion 1, stack running.
1. Open `frontend/src/components/AppFooter.tsx` → there is no version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.
2. Edit `backend/pyproject.toml` to `version = "0.1.1"`, then run `docker compose up -d --build backend` (frontend untouched) → the backend restarts.
3. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1` although the frontend was not rebuilt.
4. Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend` → after a reload the footer reads `Task Notes v0.1.0` again.

### Criterion 3: An unresolved version is omitted, never shown as undefined, null, unknown or a gap
Prerequisites: as for Criterion 1, stack running.
1. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer is present and reads exactly `Task Notes`: no ` v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap after the name.
2. In devtools Network, confirm the `/api/version` request failed (status `(failed)` or a connection error) → the footer still reads `Task Notes`.
3. Run `docker compose start backend` and reload `/` → the footer reads `Task Notes v0.1.0`.
4. Loading state: in devtools Network set throttling to `Slow 3G` and reload `/` → while `/api/version` is pending the footer reads `Task Notes` with nothing after it, then changes to `Task Notes v0.1.0` when the response arrives. Reset throttling to `No throttling`.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` → the run lists `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` and ends with `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test where the mocked client resolves a version and the footer shows it, and tests where the client rejects or resolves `null` and the footer reads exactly `Task Notes`.
