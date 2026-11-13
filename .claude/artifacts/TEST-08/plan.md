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
<!-- Criterion 2 is amended by the newest tracker comment (see Re-Plan Feedback): a comment overrides the description where the two disagree. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from the backend at runtime: the footer fetches `GET /api/version` and shows the backend's `version`. It never comes from `frontend/package.json`, a build-time variable, or a string typed into the component, so a frontend built against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. "Cannot be resolved" covers: the request is still pending (loading state), `/api/version` is unreachable or answers non-OK, the body has no non-empty `version` string, or the backend answers its own `"unknown"` sentinel.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it." → Addressed by: criterion 2 rewritten to the runtime-backend source; `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. **The endpoint is not added, because it already exists on main:** TEST-05 (done) shipped `GET /api/version` in `backend/app/routers/version.py`, returning `{"version": ...}` read from installed package metadata (`backend/app/services/version_service.py`, `importlib.metadata`, i.e. `[project].version` in `backend/pyproject.toml`, currently `0.1.0`), covered by `backend/tests/integration/test_version_integration.py`. Re-adding it would duplicate shipped code.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The comment turns this item from frontend-only into one that **depends on the backend at runtime** (a new frontend-to-backend call, CORS-dependent, and an E2E spec that needs the backend up), but it needs **no backend file change**, because the endpoint it asks for is already on main (TEST-05). The File Manifest therefore carries no `[B]` entry, deliberately. The description's note "Touches no backend file" stays literally true; "genuinely parallel" is no longer true at runtime, and TEST-09 (in flight, edits the backend version slice) is now a contract neighbour, recorded in `shared_risks.md`.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by this recorded decision: **both the loading state and the failure state render the footer as the app name alone, exactly `Task Notes`, with no version text, no placeholder, no spinner and no trailing space.** The footer is therefore never blank and never reads `unknown`. Reasons: criterion 3 already requires "renders without it" for the unresolved case; showing `unknown` would put a version-shaped string in front of a reader who reads a version to learn which API they are talking to, and it would be wrong (the backend is unknown-reachable, not unknown-versioned); a blank footer would drop the app name TEST-04 shipped. When the fetch later resolves, ` v{version}` is appended. The backend's own `"unknown"` sentinel (returned by `get_app_version()` when package metadata is missing) is treated as unresolved for the same reason, so the footer never prints `vunknown`. A request that hangs simply stays in the loading state, which looks identical to failure; no client timeout or retry is added (assumption, recorded: the existing notes client has neither, and adding one to a footer label is gold plating per `user_story_alignment.md` Section 3).
- Comment (tracker): "A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2's E2E test asserts the footer shows the backend's `0.1.0` and not the frontend's `package.json` `0.0.0` (the two differ today, so the test discriminates), and Manual verification step 2.3 bumps only the backend version and rebuilds only the backend.
- Comment (tracker), the rationale paragraph about partial deploys → informational, no separate change; it is the reason for criterion 2's amendment above.
- Other tracker comments (mayker-dev bot notices from earlier runs, an operator reset note dated 2026-09-07) → not acted on: per the dispatch, none is a requirement.
- Plan review (orchestrator, /deliver re-plan), point 1, required: "add a `## Technology Selection` line for `e2e/helpers/backendVersion.ts`" → Addressed by: a new `## Technology Selection` line recording the ladder for the helper (standard library `node:fs` plus a scoped line match, chosen over an installed TOML parser, of which there is none, and over a new one). No manifest entry changed.
- Plan review (orchestrator, /deliver re-plan), point 2, optional: "the unreachable-backend E2E edge spec ... has no test id anywhere" → Addressed by: the edge spec is named `renders the footer as the app name alone when /api/version is unreachable` in `## Testing Strategy`, in criterion 3's `Test ids` cell and in the Acceptance Test Outline. Criterion 3's covering tier stays Unit; the E2E spec is the feature's edge-case spec (`testing_standards.md` Section 4) and is listed so build Phase D does not infer its name.
- Plan review (orchestrator, /deliver re-plan), point 3 (BUG-04 is merged on main, so drop the `shared_risks.md` note) → not applied, per the dispatch: reset commit 283fc31 reverted BUG-04's merge 720a8db, and BUG-04 is a live node of this run, so the `shared_risks.md` note about BUG-04 on `LandingPage.test.tsx` and `notes.ts` stays.
- Merged since the last plan: n/a (re-plan in the same run, primary checkout at 283fc31, no `[merged-since]` lines in the dispatch).

## Plan Overview
Make the landing-page footer show the **backend's** version, fetched at runtime from the existing `GET /api/version` (TEST-05), instead of the frontend `package.json` version TEST-04 wired in. Frontend-only code change: a new typed API client `frontend/src/api/version.ts`, a shared API base-URL module `frontend/src/api/config.ts` (so the base URL has one source, now that two clients need it), and `AppFooter.tsx` owning its own fetch with a loading/failure state that renders the app name alone. `LandingPage.tsx` is **not** modified: the footer fetches for itself, which keeps this item off BUG-04's file. Tests: client unit tests, footer component tests for present/absent/pending, the LandingPage test updated to mock the new client, a new E2E spec, and TEST-04's E2E spec updated because the version it asserted (frontend `package.json`) is no longer what the footer shows.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim out of `notes.ts` so both clients read one source (`coding_standards.md` Section 5, "one value, one source").
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` instead of defining `DEFAULT_API_BASE_URL`/`API_BASE_URL` locally. No behaviour change; `notes.test.ts` keeps passing unchanged (its `vi.resetModules()` re-import re-evaluates `config.ts` too).
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }`; `export const UNRESOLVED_BACKEND_VERSION = "unknown"` (mirrors `UNKNOWN_VERSION` in `backend/app/services/version_service.py`, comment saying so); `export async function fetchBackendVersion(): Promise<string | null>`: `fetch(`${API_BASE_URL}/api/version`)`; non-OK throws `Loading the version failed: {status} {statusText}` (same shape as `notes.ts`); a body whose `version` is not a non-empty string throws `Loading the version failed: unexpected response shape`; a `version` equal to `UNRESOLVED_BACKEND_VERSION` returns `null`; otherwise returns the string. Extra fields in the body are ignored (TEST-09 may add `commit`). Network errors propagate as the `fetch` rejection.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Add `const [backendVersion, setBackendVersion] = useState<string | null>(null)`; a mount-only `useEffect` calls `fetchBackendVersion()` with the same `isMounted` guard `LandingPage.tsx` uses; on resolve set the value (which may be `null`), on reject set `null`. Render `{APP_NAME}` and, only when `backendVersion !== null`, `<span data-testid="app-footer-version"> v{backendVersion}</span>`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified**.
- Routes: none.
- State management: local `useState` in `AppFooter`; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing footer styling is kept exactly: `fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`; resolved text format `Task Notes v{version}`, unresolved (loading and failure) text exactly `Task Notes`.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version`, already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), and CORS already allows `GET` from `http://localhost:5183` (`docker-compose.yml` `CORS_ORIGINS`). This item now **depends on** that endpoint at runtime, which the description did not foresee; it changes no backend file.

## API Integration Plan
No external API integration. (The only call is to this project's own backend, contract below.)

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: `200` with JSON body `{"version": "0.1.0"}` (the value is `[project].version` of `backend/pyproject.toml`; `"unknown"` when the backend's package metadata is not installed). Already implemented by TEST-05; consumed here, not changed. The client reads only `version` and ignores any other field.

## Technology Selection
- `frontend/src/api/version.ts` HTTP call: chose the browser's native `fetch` (already what `notes.ts` uses) over adding a client library such as axios; nothing about one GET needs more.
- Footer loading/failure state: chose React's built-in `useState` + `useEffect` (already installed) over a data-fetching dependency such as react-query or SWR; one mount-time request needs no cache or refetch.
- `frontend/src/api/config.ts`: chose a three-line shared module over duplicating `DEFAULT_API_BASE_URL` in a second client; no stdlib or platform feature removes the need for one source, and `coding_standards.md` Section 5 forbids two.
- Response validation in `version.ts`: chose a `typeof` check on `version` over a schema library such as zod; one string field.
- `e2e/helpers/backendVersion.ts` (reading `[project].version` from `backend/pyproject.toml`): ladder walked in order. (a) Standard library, **chosen**: `readFileSync` from `node:fs` on `path.resolve(__dirname, "../../backend/pyproject.toml")`, the same `node:fs` read `e2e/tests/TEST-04_page_footer.spec.ts` already does for `frontend/package.json`, plus a line match scoped to the `[project]` table: walk the lines from the `[project]` header to the next `[`-prefixed table header and take the first line matching `version = "..."`; when none is found, throw `Could not read [project].version from backend/pyproject.toml`, so a spec fails loudly instead of asserting against `undefined`. Exported as `export function readBackendVersion(): string`. (b) Native platform feature: none applies to a Node test helper. (c) Already-installed dependency: neither the root `package.json` nor `frontend/package.json` installs a TOML parser, so none covers it. A new TOML parser (such as `smol-toml` or `@iarna/toml`) for one key of a file this project controls is rejected.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source of `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`), shared by both API clients
- [A] frontend/src/api/version.ts: typed client `fetchBackendVersion()` for `GET /api/version`, with non-OK, shape and `"unknown"`-sentinel handling
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed (OK, non-OK, bad shape, sentinel, extra fields ignored)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E specs, footer shows the backend version (not the frontend's) and the unreachable-backend edge case
- [D] e2e/helpers/backendVersion.ts: `readBackendVersion()` reads `[project].version` from `backend/pyproject.toml` with `node:fs` and a `[project]`-scoped line match, so the E2E specs' expected value has one source
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of defining it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes v{version}` when resolved and `Task Notes` alone while pending or on failure
- [A] frontend/src/components/AppFooter.test.tsx: replace the `package.json` assertions with tests for version present, pending, unreachable and sentinel, mocking `../api/version`
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` one
- [D] e2e/tests/TEST-04_page_footer.spec.ts: its version assertions read the frontend `package.json` (`0.0.0`), which the footer no longer shows; switch them to the backend version via `e2e/helpers/backendVersion.ts` and retitle the first test to say "the version reported by the backend"

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change. TEST-04's own Gherkin scenario and manual script under `e2e/uat/` describe TEST-04's delivered behaviour and are left as historical artifacts of that item.

## Testing Strategy
- Unit tests: Vitest. `version.ts` with `fetch` stubbed via `vi.stubGlobal` (pattern of `notes.test.ts`); `AppFooter` with `../api/version` mocked via `vi.mock` (pattern of `LandingPage.test.tsx`), covering version present, pending (a never-resolving promise), rejected, and `null` (sentinel); `LandingPage.test.tsx` updated to mock the version client. Backend unit/integration: no new tests; the existing `test_get_version_returns_200_with_version_from_pyproject` already proves the endpoint serves the declared `pyproject.toml` version.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`, existing convention)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new integration tests; no backend file changes, and the endpoint's router cycle is already covered by `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: `shows the backend version in the landing page footer` and `shows the backend version, not the frontend package version` (footer on `/` shows the backend `pyproject.toml` version and not the frontend `package.json` version; needs the real backend, so it is the only tier that proves the runtime wiring, CORS included); edge-case spec `renders the footer as the app name alone when /api/version is unreachable`, with `page.route("**/api/version", (route) => route.abort())` and the footer text asserted to be exactly `Task Notes`. TEST-04's spec updated to the backend version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the landing page footer` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never package.json, a build-time variable or a typed string | E2E | `shows the backend version, not the frontend package version`, `requests GET /api/version and returns the backend version`, `test_get_version_returns_200_with_version_from_pyproject` | — |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or empty gap) | Unit | `renders the app name alone while the version request is pending`, `renders the app name alone when the version request fails`, `renders the app name alone when the backend reports an unknown version`, `returns null when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response has no version string`, `renders the footer as the app name alone when /api/version is unreachable` (E2E edge spec) | verifying it needs no navigation or interaction: it is the component's rendering of a pending, rejected or null client result, which a mocked client drives deterministically; the one E2E edge spec is the feature's required edge case, not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by the backend`, `renders the app name alone when the version request fails` | the criterion is itself a component test; no browser is involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` contains `Task Notes v{backend version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | Same page; assert footer contains the `pyproject.toml` version and does not contain `v` + the `frontend/package.json` version | Given the backend version is 0.1.0 and the frontend package version is 0.0.0, When I open the landing page, Then the footer shows 0.1.0 and not 0.0.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; one E2E edge spec, `renders the footer as the app name alone when /api/version is unreachable`, aborts `/api/version` and asserts the footer text is exactly `Task Notes` | Given the backend version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When it runs, Then the AppFooter tests pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build`; the backend answers `http://localhost:8010/api/version`; `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open `http://localhost:5183/` in a browser → the "Task Notes" heading, the note form and the footer are visible.
2. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as criterion 1; `frontend/package.json` has `"version": "0.0.0"`.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` with DevTools → Network open, reload → a `GET` request to `http://localhost:8010/api/version` with status 200 appears, and the footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
3. Edit `backend/pyproject.toml` to `version = "0.1.1"`, then rebuild only the backend with `docker compose up -d --build backend`; do not rebuild the frontend → when the backend is up again, reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1` (the frontend bundle was not rebuilt, so the value came from the backend at runtime).
4. Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend` again → after a reload the footer reads `Task Notes v0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as criterion 1.
1. Stop the backend with `docker compose stop backend`.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing gap after the name; the rest of the page still renders.
3. Start the backend with `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, reload → the footer reads `Task Notes v0.1.0` again.
4. Loading state: in DevTools → Network, set throttling to "Slow 3G" and reload → until the `/api/version` request completes the footer reads exactly `Task Notes`, then ` v0.1.0` appears after it. Reset throttling to "No throttling".

### Criterion 4: A component test asserts both paths
This criterion is a property of the test suite, not of the UI; the observable check is the test run.
1. From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the output lists `renders the version returned by the backend` and `renders the app name alone when the version request fails` among the tests run, and reports `0 failed`.
