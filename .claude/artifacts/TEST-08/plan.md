# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (Tracker task 123k99ctgch. The newest tracker comment amends criterion 2 and adds the loading and failure states; see `## Re-Plan Feedback`. The criteria below are the amended ones.)

## Acceptance Criteria
- [ ] 1. The footer on the landing page renders the version string.
- [ ] 2. (Amended by tracker comment) The version comes from the backend at runtime: the footer fetches `GET /api/version` and shows the backend's version, never the frontend `package.json` version and never a string typed into the component. A frontend built against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved (`/api/version` unreachable, a non-OK response, a body without a usable `version` string, or the backend's own `unknown` sentinel), the footer renders without it. It shows no `undefined`, `null`, `unknown` and no empty gap.
- [ ] 4. A component test asserts both paths: version present and version absent.
- [ ] 5. (Added by tracker comment) Before the fetch resolves, the footer shows its loading state: the app name with no version, which is the same text as the failure state.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by the following decisions:
  1. **Version source.** Criterion 2 is rewritten. The footer fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. The `package.json` import is removed from `AppFooter.tsx`.
  2. **Backend scope, stated explicitly.** The comment asks for a backend endpoint, so this item is no longer frontend-only in intent. **However, `GET /api/version` already exists on main** (TEST-05, done: `backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<backend/pyproject.toml version>"}` from installed package metadata, with integration coverage in `backend/tests/integration/test_version_integration.py`). It already has the shape the comment asks for, so this plan **adds no backend file**, and the File Manifest carries no `[B]` entry. CORS already admits the frontend origin `http://localhost:5183` for GET (`backend/app/core/config.py`). If the builder finds the endpoint missing or changed on its base, that is a plan deviation to report, not to absorb silently.
  3. **Loading state (decided).** Before `/api/version` resolves, the footer renders the app name alone: `Task Notes`. It is not blank, shows no spinner and no "loading" text, and the version is appended once it arrives. Reason: a footer that is blank and then fills in is layout noise. The app name is static and always true.
  4. **Failure state (decided).** If `/api/version` is unreachable or unusable, the footer renders `Task Notes`, the same as the loading state, and never `unknown`. Reason: criterion 3 already says "renders without it", and the comment distinguishes a blank footer from one reading `unknown`. We choose neither: the footer shows the app name with no version segment. The backend's own sentinel `unknown` (version_service.py, when the distribution is not installed) is treated as unresolved for the same reason. It is not a version, and showing `vunknown` is the answer the comment asked us not to default to.
  5. **Description note "It modifies `LandingPage.tsx`"** is not acted on for the component. The fetch lives in `AppFooter.tsx`, so `LandingPage.tsx` is not modified. Only `LandingPage.test.tsx` changes, because it asserts the `package.json` version in the footer and would otherwise render a component that now calls the network.
- Comment (tracker, 2026-09-07 operator note about a sandbox reset/revert): not acted on because it is sandbox history, not a requirement for this item.
- Merged since the last plan: n/a. This is a first plan on this run, based on main @ ac6e44c. No `[merged-since]` lines were dispatched.

## Plan Overview
This is a frontend change that consumes an existing backend endpoint. A new typed client `fetchBackendVersion()` calls `${API_BASE_URL}/api/version` and returns the version string, or `null` when it cannot be resolved. `AppFooter` fetches it once on mount and renders `Task Notes v{version}` when it resolves, or `Task Notes` while loading and on failure. The API base URL constant moves out of `notes.ts` into a shared `api/config.ts`, so both clients read one source and the default is not duplicated (`coding_standards.md`, deployment-dependent values). The existing tests that pinned the footer to `frontend/package.json` (the AppFooter and LandingPage component tests and the TEST-04 E2E spec) are updated to the new source. No backend, database, dependency or configuration change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`. These are the exact constant and default that `notes.ts` declares today, moved without changing them.
  - `frontend/src/api/notes.ts` (modify): drop its local `DEFAULT_API_BASE_URL` and `API_BASE_URL` and import `API_BASE_URL` from `./config`. Behaviour is unchanged, and `notes.test.ts` (including its `vi.resetModules()` env-override case) must pass untouched.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. It does `fetch(`${API_BASE_URL}/api/version`)`. It returns `null` on a rejected fetch (network failure), on `!response.ok`, on a body whose `version` is not a non-empty string, and on the backend sentinel `"unknown"`. Otherwise it returns the string. It never throws, because "could not resolve" is a normal outcome for the footer, not an error to surface. The type `VersionResponse = { version: string }` mirrors `backend/app/schemas/version.py`.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Add `const [version, setVersion] = useState<string | null>(null)` and a `useEffect` that calls `fetchBackendVersion()` once, with an `isMounted` guard in the same pattern `LandingPage.tsx` uses for `listNotes`. Render `{APP_NAME}{version ? ` v${version}` : ""}` inside the existing `<footer data-testid="app-footer">`. The text is exactly `Task Notes` with no trailing space when there is no version. `footerStyle` is unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.**
- Routes: none.
- State management: local component state in `AppFooter` (`useState` + `useEffect`), with no context and no store.
- Design reference notes: AI freestyle. Design Reference mode is NONE. Keep the existing footer styling (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) and the existing text format `Task Notes v{version}`.

## Backend Plan
No backend changes required. The comment's requested `GET /api/version` endpoint already exists on main from TEST-05 (see `## Re-Plan Feedback` item 2). This is stated here deliberately so that the absence of backend entries in the File Manifest is explained, not silent.

## API Integration Plan
No external API integration. The footer consumes this project's own existing backend endpoint, specified under `## API Contract`.

## API Contract
- Method: GET
- URL: `/api/version` (on the backend base URL, `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: 200, `application/json`, for example `{"version": "0.1.0"}`. The value is `[project].version` from `backend/pyproject.toml` via installed package metadata. When the distribution is not installed, the value is `"unknown"`, which the frontend treats as unresolved.
- Frontend client contract: `fetchBackendVersion(): Promise<string | null>`. It returns the version string, or `null` for a network error, a non-2xx response, a missing or empty or non-string `version`, or `"unknown"`.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the native `fetch` API, as `notes.ts` already uses, over adding an HTTP client library (axios, ky) or a data-fetching library (React Query, SWR). One GET with no retry or caching needs nothing more.
- Footer loading/version state: chose React's built-in `useState` + `useEffect` (already installed) over a data-fetching dependency, for the same reason.
- `frontend/src/api/config.ts` (shared base URL): no stdlib call, native feature or installed dependency covers it, so it is built here. It is a two-line module that moves an existing constant so two clients share one source instead of duplicating the default.
- No new dependency is added, so `frontend/package.json` and `frontend/package-lock.json` are unchanged.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: the single source of the backend base URL (`VITE_API_BASE_URL` with the existing `http://localhost:8010` default), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` typed client for `GET /api/version`, returning the version or `null` when unresolved
- [A] frontend/src/api/version.test.ts: unit tests for the client with `fetch` stubbed: the happy path and the URL called; `null` on a rejected fetch, on a non-OK status, on a missing or empty `version`, and on `"unknown"`
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs. The footer shows the version the page's own `/api/version` response carried. Edge case: with `/api/version` aborted, the footer reads exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script that build-feature writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of declaring it locally, with no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes v{version}` or `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the version-present path (`Task Notes v1.2.3`), the version-absent path (resolves `null`, exact text `Task Notes`, no `undefined`, `null`, `unknown`), and the loading state before resolution; keep the contentinfo-landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` as well as `../api/notes`, and replace the `package.json` version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: remove the `frontend/package.json` version read and the assertions on it, which this item makes false. Keep the name, landmark, heading and mobile-visibility checks. The version assertion moves to TEST-08's spec

No dependency changes, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: neither mentions the footer or its version source, and this item changes no project structure, run configuration, dependency or test infrastructure.
TEST-04's historical UAT artifacts (`e2e/uat/scenarios/TEST-04_page_footer.feature` and its script) are not edited. They record TEST-04's delivered behaviour, are validated for well-formedness only, and are superseded for the version source by TEST-08's own scenarios.

## Testing Strategy
- Unit tests: the `fetchBackendVersion` client (every resolve-to-`null` branch plus the happy path and the URL), and `AppFooter` component behaviour (present, absent, loading), with `../api/version` mocked. `notes.test.ts` re-runs unchanged as the regression check for the base-URL move.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the existing Vitest convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests use
- Integration tests: no new integration test. The backend endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers with `DATABASE_URL` unset, 405 on POST). The frontend has no integration tier.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: one spec file. (a) Navigate to `/`, capture the page's own `/api/version` response with `page.waitForResponse`, and assert `getByTestId("app-footer")` has text exactly `Task Notes v{body.version}`. This needs no host port hardcoded in the spec. (b) Edge case: `page.route("**/api/version", (route) => route.abort())`, navigate to `/`, and assert the footer has text exactly `Task Notes`. TEST-04's spec is edited to drop its now-false `package.json` assertions.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer on the landing page renders the version string | E2E | — |
| 2 | The version comes from the backend `GET /api/version` at runtime, not `package.json` or a literal | Unit | Verifying it needs no navigation or interaction: it is a wiring fact about which URL the client calls and what the component renders from it, asserted in `version.test.ts` and `AppFooter.test.tsx` (E2E spec (a) also shows the footer matching the live response) |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`/`null`/`unknown`/gap) | Unit | Verifying it needs no navigation or interaction: every unresolved branch is a client/component rule, asserted exactly in `version.test.ts` and `AppFooter.test.tsx` (E2E spec (b) adds the one aborted-request edge case) |
| 4 | A component test asserts both paths: version present and version absent | Unit | The criterion is itself a component test (`AppFooter.test.tsx`) |
| 5 | Before the fetch resolves, the footer shows the app name with no version | Unit | Verifying it needs no navigation or interaction: a pending mocked promise in `AppFooter.test.tsx` holds the loading state deterministically, which a browser test cannot do without timing races |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Spec (a): goto `/`, await the `/api/version` response, footer has text `Task Notes v{body.version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports a version different from the frontend package version, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version renders without it | covered at Unit, see Criterion coverage (spec (b) is the edge case) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |
| 5 | Loading state shows the app name only | covered at Unit, see Criterion coverage | Given the version request is slow, When the landing page first renders, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
Common prerequisites: the stack is running from the repo root with `docker compose up -d --build`. The frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`.

### Criterion 1: The footer on the landing page renders the version string
Prerequisites: the stack is running and all three services (db, backend, frontend) are up.
1. In a browser tab, open `http://localhost:8010/api/version` → the page shows JSON `{"version":"0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`). Note the value.
2. Open `http://localhost:5183/` → the landing page shows the heading "Task Notes".
3. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0`, the value from step 1.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: same as Criterion 1.
1. Open `frontend/package.json` and read its `"version"` field → it is `0.0.0`, which differs from the backend's `0.1.0`.
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`.
3. Open DevTools → Network tab and reload the page → there is a GET request to `http://localhost:8010/api/version` with status 200, and its response body's `version` matches the footer.
4. Open `frontend/src/components/AppFooter.tsx` → it has no `package.json` import and no version literal.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running.
1. From the repo root, run `docker compose stop backend` → the backend container stops, and `http://localhost:8010/api/version` no longer loads.
2. Open or reload `http://localhost:5183/` → the page still renders. The footer reads exactly `Task Notes`, with no ` v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Run `docker compose start backend` and reload the page after a few seconds → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: the frontend dependencies are installed (`npm --prefix frontend ci`).
1. From the repo root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test names include a version-present case and a version-absent case.

### Criterion 5: Before the fetch resolves, the footer shows the app name with no version
Prerequisites: the stack is running.
1. Open `http://localhost:5183/`, open DevTools → Network, and set throttling to "Slow 3G".
2. Reload the page and watch the footer while the `/api/version` request is pending → the footer reads `Task Notes` (not blank, not "loading", no version).
3. Wait for the request to finish → the footer changes to `Task Notes v0.1.0`. Reset throttling to "No throttling".
