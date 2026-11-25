# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description).**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> The tracker comment recorded under `## Re-Plan Feedback` overrides criterion 2, the "frontend only" note and the "package metadata" source. The criteria below are the amended set this plan builds.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source: the backend's `GET /api/version`, fetched at runtime (the backend resolves it from `backend/pyproject.toml` package metadata). Never `frontend/package.json`, never a build-time variable, never a string typed into the component. A frontend built against an older backend shows the backend's version, not its own. (Amended by the tracker comment.)
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap. "Cannot be resolved" covers: the request still pending (loading state), `/api/version` unreachable or answering non-2xx (failure state), a response with no string `version`, and the backend's own `unknown` sentinel. In every one of those cases the footer reads exactly `Task Notes`. (Loading and failure states decided per the tracker comment.)
- [ ] 4. A component test asserts both paths: version present, and version absent (loading and failure each asserted).
- [ ] 5. `GET /api/version` returns the backend's version. (Added by the tracker comment; already delivered by TEST-05, see Backend Plan.)

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 amended; the footer fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`, and the `package.json` import is removed from `AppFooter.tsx` and from every test that asserted it. The endpoint itself is NOT added: it already exists on `main` (TEST-05, `backend/app/routers/version.py`, returning `{"version": "0.1.0"}` from `importlib.metadata`, covered by `backend/tests/integration/test_version_integration.py`). Adding it again would duplicate a delivered route, so the plan reuses it and records that as criterion 5 with its existing test.
- Comment (tracker), consequence 1: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded in criterion 3 and in the Frontend Plan. Loading: the footer reads `Task Notes` (app name, no version, no placeholder). Failure (network error, non-2xx, malformed body): the footer reads `Task Notes`. Backend answers with its `unknown` sentinel (`UNKNOWN_VERSION` in `backend/app/services/version_service.py`, returned when the distribution is not installed): the footer reads `Task Notes`. Chosen over a blank footer (the footer is the contentinfo landmark and must keep identifying the app) and over printing `unknown` (criterion 3 forbids a non-answer in the version slot, and `unknown` would echo a backend fallback as if it were a version). Chosen over a `Loading…` placeholder because it would flash on every page load for a value that resolves in one local round trip, and would then need a third distinct test path. Assumption: no retry and no client-side timeout; a hung request leaves the footer at `Task Notes`, which is the same answer as failure. The existing notes client also has neither, and adding them for a cosmetic value is gold plating under `user_story_alignment.md` Section 3.
- Comment (tracker), consequence 2: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in Plan Overview. The honest answer is narrower than the comment expects: the item gains a backend RUNTIME dependency (the footer is only correct when the backend is reachable and CORS admits the frontend origin) but NO backend FILE change, because the endpoint shipped with TEST-05. The File Manifest therefore carries no `[B]` entry, and the Backend Plan says so. The description's claim that the item "touches no backend file, so it is genuinely parallel with TEST-07" stays true at the file level; the scheduler's disjointness note on TEST-07 and BUG-01 is unaffected. What does change: TEST-09 ("Version endpoint reports the build commit") and FEAT-8 edit the same endpoint; this plan depends only on the response carrying a string `version` field, so an additive field from either is safe and a rename or removal of `version` would break the footer (recorded in `shared_risks.md`).
- Consequence not raised by the comment but forced by it: TEST-04's E2E spec and `LandingPage.test.tsx` assert the footer shows `frontend/package.json`'s version (`0.0.0`). The backend reports `0.1.0`, so both would fail after this change. They are modified to stop asserting the superseded source; TEST-04's Gherkin scenario and manual script carry the same superseded line and are corrected so no committed artifact still claims `package.json` is the source.

## Plan Overview
Frontend change, with a runtime dependency on an existing backend endpoint and no backend file change. A new client module `frontend/src/api/version.ts` fetches `GET /api/version` and returns the version string or `null` when the backend reports its `unknown` sentinel; it throws on network errors, non-2xx and a malformed body, matching the notes client. The API base URL moves out of `notes.ts` into `frontend/src/api/baseUrl.ts` so both clients read the one value (`coding_standards.md` Section 5, one value, one source). `AppFooter.tsx` drops its `package.json` import, fetches the version on mount, and renders `Task Notes v{version}` once resolved and `Task Notes` in every other state. `LandingPage.tsx` is NOT modified: `AppFooter` owns its own fetch, so the description's note that this item modifies `LandingPage.tsx` no longer holds. Tests: client unit tests, footer component tests for present, loading and failure, a TEST-08 E2E spec for the present path and the unreachable-endpoint edge, and adjustments to the two existing tests that asserted the old source.

## Frontend Plan
- Components to create/modify:
  `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, read from `import.meta.env.VITE_API_BASE_URL` with the existing default `http://localhost:8010`, moved verbatim from `notes.ts`.
  `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. Calls `${API_BASE_URL}/api/version`. Non-2xx throws `Loading the version failed: {status} {statusText}` (same shape as `notes.ts`'s `requestFailed`). Body whose `version` is not a non-empty string throws `Unexpected version response`. Body `version === "unknown"` returns `null` (the backend's sentinel for "could not resolve"). Otherwise returns the string. Exports the response type `VersionResponse = { version: string }`.
  `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of declaring its own; no behaviour change.
  `frontend/src/components/AppFooter.tsx` (modified): removes `import { version } from "../../package.json"`. Holds `backendVersion: string | null` in `useState`, initial `null`. A mount `useEffect` calls `fetchBackendVersion()`, sets the result, swallows a rejection (leaves `null`), and guards against setting state after unmount with the same `isMounted` flag pattern `LandingPage.tsx` uses. Renders `Task Notes` followed by ` v{backendVersion}` only when `backendVersion` is a non-null string, so no `undefined`, `null` or trailing space can render. Keeps `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged. Adds `data-testid="app-footer-version"` on a `<span>` wrapping ` v{backendVersion}`, rendered only when resolved, so tests can assert presence and absence without string arithmetic.
  `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local `useState` in `AppFooter`; no context, no store.
- Footer states (recorded per the tracker comment): loading reads `Task Notes`; resolved reads `Task Notes v0.1.0` (the backend's version at plan time); failure (unreachable, non-2xx, malformed) reads `Task Notes`; backend sentinel `unknown` reads `Task Notes`.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing inline values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required. `GET /api/version` already exists on `main` (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`), returns `{"version": "<backend/pyproject.toml version>"}` read from package metadata, needs no database, and is registered in `backend/app/main.py`. CORS already admits `GET` from the frontend origin `http://localhost:5183` (`backend/app/core/config.py` `DEFAULT_CORS_ORIGINS`, `allow_methods=["GET", "POST"]`). Its existing integration test covers criterion 5.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}`. The frontend relies only on `version` being a string. `"unknown"` is the backend's unresolved sentinel and is rendered as no version. Any additional field (for example a build commit from TEST-09) is ignored.

## Technology Selection
- `frontend/src/api/version.ts` HTTP call: chose the browser's native `fetch`, as `notes.ts` already does, over adding an HTTP client library; no new dependency.
- Response validation in `version.ts`: chose a `typeof body.version === "string"` check over a schema library such as zod; the project installs none and one field needs one line.
- `frontend/src/api/baseUrl.ts`: chose extracting the existing constant over a second copy of `http://localhost:8010` in `version.ts`; no stdlib, platform feature or dependency is involved, it is a move of existing code.
- Footer loading state: chose React's own `useState` and `useEffect` (installed) over a data-fetching library such as react-query; one request on mount needs no cache.
- E2E unreachable-endpoint path: chose Playwright's built-in `page.route(...).abort()` (installed) over a mock server; no new dependency.
- No dependency is added or removed, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` value both API clients import (moved from notes.ts)
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, with the `VersionResponse` type
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client, with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the backend version, and omits it when /api/version is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-endpoint edge
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: build-feature's copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the backend version on mount, render it only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the package.json assertion with present, loading and failure tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; footer assertion reads the mocked backend version instead of package.json
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop asserting frontend/package.json's version (superseded source); keep the name, landmark, layout and mobile assertions
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: version line names the backend's /api/version instead of frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against the backend's /api/version instead of frontend/package.json

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (the frontend already reaches the backend through `VITE_API_BASE_URL`), and neither file mentions the footer's version source.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed with `vi.stubGlobal` as `notes.test.ts` does) and the footer component (`frontend/src/components/AppFooter.test.tsx`, `../api/version` mocked with `vi.mock`). `notes.test.ts` stays as is and must still pass after the base-URL move, including its `VITE_API_BASE_URL` override test.
  - Directory: frontend/src/ (co-located `*.test.ts(x)`, per `.claude/project-standards.md` Layout)
  - Naming: `{Module}.test.ts(x)` beside the module
- Integration tests: no new test. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py`, which criterion 5 cites.
  - Directory: backend/tests/integration/
- E2E tests: the present path through the real backend, and the unreachable-endpoint edge via `page.route("**/api/version", (route) => route.abort())`. The expected version is read from `backend/pyproject.toml`'s `[project].version` in the spec, mirroring how TEST-04's spec reads its file, never typed as a literal. The edge spec must wait for the aborted request (`page.waitForEvent("requestfailed")` filtered on `/api/version`) before asserting, so it cannot pass on the loading state by accident.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-endpoint edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the landing page footer` | covered at E2E |
| 2 | The version comes from the backend's GET /api/version at runtime, never frontend package.json or a typed string | Unit | `requests the version from the backend /api/version endpoint`, `renders the version the backend reports, not the frontend package version` | verifying it needs no navigation or interaction: it is which URL the client calls and that the rendered value is the mocked backend value; the E2E spec for criterion 1 additionally compares against backend/pyproject.toml |
| 3 | When the version cannot be resolved, the footer reads `Task Notes` with no undefined, null, unknown or gap | Unit | `renders only the app name while the version is loading`, `renders only the app name when the version request fails`, `returns null when the backend reports the unknown sentinel`, `throws when the response is not OK`, `throws when the response has no string version`, `omits the version when /api/version is unreachable` | each state is a branch of the client and the component, driven by a mock with no navigation; the last id is the E2E edge spec that also exercises it in the browser |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports, not the frontend package version`, `renders only the app name while the version is loading`, `renders only the app name when the version request fails` | the criterion is itself a component-test requirement |
| 5 | GET /api/version returns the backend's version | Integration | `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a router behaviour, already delivered and tested by TEST-05 |

Test naming the builder must use exactly: in `version.test.ts`, `requests the version from the backend /api/version endpoint`, `returns null when the backend reports the unknown sentinel`, `throws when the response is not OK`, `throws when the response has no string version`; in `AppFooter.test.tsx`, `renders the version the backend reports, not the frontend package version`, `renders only the app name while the version is loading`, `renders only the app name when the version request fails`, plus the two existing name and landmark tests kept; in `TEST-08_footer_app_version.spec.ts`, `shows the backend version in the landing page footer` and `omits the version when /api/version is unreachable`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | goto `/`, expect `app-footer-version` visible and `app-footer` to contain `v` + backend/pyproject.toml version | Given the backend is running When I open the landing page Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage; the criterion 1 spec compares against the backend's pyproject, not the frontend's package.json | Given the backend reports a version different from frontend/package.json When I open the landing page Then the footer shows the backend's version |
| 3 | Unresolved version renders only the app name | `omits the version when /api/version is unreachable`: route abort, wait for the failed request, expect `app-footer` to have text exactly `Task Notes` and `app-footer-version` absent | Given /api/version is unreachable When I open the landing page Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite When it runs Then the present, loading and failure footer tests pass |
| 5 | GET /api/version returns the backend's version | covered at Integration, see Criterion coverage | Given the backend is running When I request GET /api/version Then I receive 200 with the pyproject version |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up`), backend on `http://localhost:8010`, frontend on `http://localhost:5183`; `backend/pyproject.toml` `[project].version` reads `0.1.0` (read it, do not assume it).
1. Open `http://localhost:5183/` in a browser → the landing page shows the title "Task Notes".
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`, where `0.1.0` equals the value you read in `backend/pyproject.toml`.

### Criterion 2: The version comes from the backend's GET /api/version at runtime
Prerequisites: as for criterion 1; `frontend/package.json` `"version"` reads `0.0.0` and `backend/pyproject.toml` reads `0.1.0`, so the two sources differ.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/`, open the browser dev tools Network tab, and reload → a request to `http://localhost:8010/api/version` appears with status 200.
3. Read the footer → it reads `Task Notes v0.1.0`, the backend's value, and does NOT read `v0.0.0`, the frontend package's value.

### Criterion 3: When the version cannot be resolved, the footer reads `Task Notes`
Prerequisites: the frontend is running on `http://localhost:5183`.
1. Stop only the backend (`docker compose stop backend`) → `http://localhost:8010/api/version` no longer answers.
2. Open `http://localhost:5183/` and reload → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap after the name.
3. In dev tools Elements, inspect the `<footer data-testid="app-footer">` → it contains no element with `data-testid="app-footer-version"`.
4. Start the backend again (`docker compose start backend`) and reload the page → the footer reads `Task Notes v0.1.0` again.
5. Loading state: with dev tools Network throttling set to "Slow 3G", reload → while the `/api/version` request is pending the footer reads `Task Notes`, then gains ` v0.1.0` when it completes; it never shows a placeholder.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: no failed or errored test on the summary line, exit code 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the version the backend reports, not the frontend package version`, `renders only the app name while the version is loading` and `renders only the app name when the version request fails`.

### Criterion 5: GET /api/version returns the backend's version
This is a backend response, not a UI behaviour; check it directly.
1. Run `curl -s http://localhost:8010/api/version` with the stack up → the output is `{"version":"0.1.0"}`, matching `backend/pyproject.toml`.
2. From the repository root run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the database service up → the run passes: no failed or errored test on the summary line, exit code 0.
