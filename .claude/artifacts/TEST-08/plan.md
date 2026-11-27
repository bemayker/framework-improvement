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

## Acceptance Criteria
<!-- Criteria 2 and 3 are amended and criterion 5 is added by the tracker comment recorded under Re-Plan Feedback; a comment overrides the description where the two disagree. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from the backend at runtime: the footer fetches `GET /api/version` and shows the backend's version, never the frontend's own `package.json` version and never a string typed into the component. A frontend built against an older backend shows the backend's version.
- [ ] 3. (amended by tracker comment) When the version cannot be resolved (`/api/version` unreachable, non-2xx, malformed body, or the backend's own `unknown` sentinel), the footer renders without it, reading exactly `Task Notes`, rather than showing `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by tracker comment) Before the `/api/version` fetch resolves, the footer reads exactly `Task Notes`: no version, no placeholder, no spinner, and it is never blank.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by, point by point:
  (a) Source of the version: criterion 2 is amended; `AppFooter.tsx` drops its `import { version } from "../../package.json"` and fetches `GET /api/version` at runtime through a new client `frontend/src/api/version.ts`. The description's "frontend package metadata or a build-time variable" is overridden by the comment.
  (b) "Add a GET /api/version endpoint": not built, because it already exists on main at plan base 5f937c3e. TEST-05 shipped it (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`), it returns `{"version": "<backend/pyproject.toml [project].version>"}` from installed package metadata (currently `0.1.0`), and `backend/tests/integration/test_version_integration.py` already covers it. Re-adding it would duplicate a merged route.
  (c) Backend change, named explicitly as the comment asks: the comment framed this item as gaining a backend change, but the endpoint it needs is already present and behaves as required, so **this plan makes no backend change**; `## Backend Plan` says so and the File Manifest carries no `[B]` entry. The item's backend dependency is a runtime one: the footer now depends on TEST-05's endpoint and on the backend's CORS middleware allowing `GET` from the frontend origin, which `backend/app/main.py` already does.
  (d) Loading state (decision, recorded): the footer renders `Task Notes` alone until the fetch resolves. Not blank (the app name is static and always known, and a blank footer would flash then fill), not a placeholder such as `v…` or `loading` (a placeholder is a string that could be mistaken for a version). New criterion 5.
  (e) Failure state (decision, recorded): the footer renders `Task Notes` alone when `/api/version` is unreachable, answers non-2xx, returns a body without a non-empty string `version`, or returns the backend's `unknown` sentinel (`UNKNOWN_VERSION` in `version_service.py`). Chosen over a footer reading `unknown` because the original criterion 3 already says "renders without it", the comment does not override that, and `unknown` is the backend's internal sentinel rather than a version. Loading and failure therefore render identically, deliberately: in both cases there is no version to report. Amended criterion 3.
  (f) Ambiguity assumption: the footer fetches once on mount and does not poll or retry; a backend redeployed under an open tab shows its new version on the next page load. Retry with backoff (`coding_standards.md` Section 4) applies to external APIs; this is the project's own backend, and the notes client does not retry either.

## Plan Overview
Frontend-only change. A new single-purpose API client `frontend/src/api/version.ts` fetches the backend's `GET /api/version` and resolves to the version string or `null`. `AppFooter.tsx` owns the fetch (`useEffect` + `useState`), renders `Task Notes v{version}` when a version arrives and `Task Notes` otherwise. `LandingPage.tsx` is not edited: it already renders `<AppFooter />`, and keeping the fetch inside the footer keeps this item off the file BUG-04 and TEST-10 are serialized on. The API base URL, today private to `api/notes.ts`, moves to one shared module `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). TEST-04's E2E spec, Gherkin and manual script assert the footer against `frontend/package.json`, which becomes false (frontend `0.0.0` vs backend `0.1.0`), so they are updated to assert against the backend's reported version. No backend change: the endpoint is TEST-05's and exists on main.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `api/notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`; returns the trimmed `version` when the response is 2xx and the body is an object whose `version` is a non-empty string other than `"unknown"`; returns `null` on a rejected fetch (network error, CORS), a non-2xx status, a JSON parse failure or any other body shape. It never throws, so the component has one path for "absent". Export `UNKNOWN_BACKEND_VERSION = "unknown"` alongside it, with a one-line comment that it mirrors the backend's `UNKNOWN_VERSION` sentinel.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; `const [version, setVersion] = useState<string | null>(null)`; `useEffect` calls `fetchBackendVersion()` once on mount with the same `isMounted` guard `LandingPage.tsx` uses; render `{APP_NAME}` always, and ` v{version}` only when `version` is non-null (a conditional fragment, so absent means no `v`, no trailing space, no `undefined`). Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` (`string | null`, `null` meaning loading or unresolved, which render identically per Re-Plan Feedback (d) and (e)).
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing footer values are kept unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; text `Task Notes v{version}` when present, `Task Notes` when absent or loading.

## Backend Plan
No backend changes required.

The tracker comment asks for a `GET /api/version` endpoint, which reads as a backend change on a frontend-only item; it is named here as the comment requests. The endpoint already exists on main (TEST-05: `backend/app/routers/version.py`, returning `{"version": ...}` from `task-notes-backend` package metadata, `unknown` when the metadata is missing, always 200), with integration coverage in `backend/tests/integration/test_version_integration.py`. CORS in `backend/app/main.py` already allows `GET` from the configured frontend origin. Nothing in this item edits, adds or tests backend code; see Re-Plan Feedback (b) and (c).

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged, from TEST-05:
- Method: GET
- URL: `/api/version` (base: `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: 200, `{"version": "0.1.0"}`. The backend answers `{"version": "unknown"}` when its package metadata is not installed; the client maps that to `null`.
- Client contract: `fetchBackendVersion(): Promise<string | null>`, never rejects; `null` means "render without a version".

## Technology Selection
- `frontend/src/api/version.ts` HTTP call: chose the browser's native `fetch` over adding axios or a data-fetching library (neither is installed), matching `api/notes.ts`.
- Loading/failure state in `AppFooter`: chose React's own `useState` + `useEffect` over a state or query library (none installed); one request on mount needs nothing more.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency holds a shared constant; it is a three-line module extracted from `api/notes.ts`, chosen over duplicating the base URL into the version client.
- No new dependency, no lockfile change.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` source shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, resolving to the version string or `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (success, network failure, non-2xx, malformed body, empty string, `unknown` sentinel)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the version the backend reported, and renders without one when `/api/version` fails
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the version from the backend on mount, render `Task Notes v{version}` or `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, backend-over-package version, loading and failure paths; drop the package.json assertion
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; the footer assertion checks the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the footer against the version the page received from `/api/version` instead of `frontend/package.json`, which this item makes false
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step compares against `GET /api/version` instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against `GET /api/version` instead of `frontend/package.json`

No dependency is added, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest, beside the code. `api/version.test.ts` stubs `fetch` (`vi.stubGlobal`) and covers every branch of `fetchBackendVersion`. `AppFooter.test.tsx` mocks `../api/version` (`vi.mock`, as `LandingPage.test.tsx` mocks `../api/notes`) and covers present, pending, and failed. `LandingPage.test.tsx` mocks it too so the page test stays network-free.
  - Directory: beside the component under `frontend/src/` (project convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new integration test. The item adds or modifies no router, service or repository; `GET /api/version` is covered by TEST-05's `backend/tests/integration/test_version_integration.py`, which stays unchanged and green.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1 (the footer, rendered by the real frontend against the real backend, shows the backend's version) plus the edge case (`/api/version` aborted via `page.route`, footer reads exactly `Task Notes`). The expected version is read from the `/api/version` response the page itself makes (`page.waitForResponse`), so no backend URL or port is hardcoded in the spec. TEST-04's spec is updated the same way.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus a backend-unreachable edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version reported by GET /api/version in the landing page footer`, `renders the footer with the app name and the backend version` | — |
| 2 | The version comes from the backend at runtime, never the frontend package.json or a literal | Unit | `renders the backend version rather than the frontend package version`, `returns the version string from GET /api/version` | Verifying it needs no navigation or interaction: it is which source the component and client read, asserted with a mocked backend value distinct from package.json's |
| 3 | When the version cannot be resolved the footer renders without it, never undefined, null, unknown or a gap | Unit | `renders exactly the app name when the backend is unreachable`, `returns null when the request fails`, `returns null on a non-OK response`, `returns null when the body has no version string`, `returns null when the backend reports the unknown sentinel` | Verifying it needs no navigation or interaction: it is the component's absent-value rendering and the client's error mapping (the E2E edge-case spec also exercises it) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by the backend`, `renders exactly the app name when the backend is unreachable` | The criterion is itself a component test |
| 5 | Before the fetch resolves, the footer reads exactly Task Notes, never blank and never a placeholder | Unit | `renders exactly the app name while the version request is pending` | Verifying it needs no navigation or interaction: a pending promise is only controllable deterministically in a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, wait for the `/api/version` response, assert `app-footer` contains `Task Notes v` + that response's `version` | Given the app is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports 0.1.0 and frontend/package.json says 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version renders without it | covered at Unit, see Criterion coverage; edge-case spec aborts `/api/version` and asserts the footer text is exactly `Task Notes` | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the present and absent cases pass |
| 5 | Loading state shows Task Notes only | covered at Unit, see Criterion coverage | Given a slow backend, When the landing page first renders, Then the footer reads "Task Notes" with no placeholder |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build`; backend on http://localhost:8010, frontend on http://localhost:5183.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}` (the value in `backend/pyproject.toml` `[project].version`); note the value.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form, and a footer at the bottom.
3. Read the footer → it reads `Task Notes v0.1.0`, the value noted in step 1.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as Criterion 1; `frontend/package.json` `version` is `0.0.0` and the backend reports `0.1.0`.
1. Open `frontend/package.json` and read the `version` field → `0.0.0`.
2. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
3. In browser devtools, Network tab, reload http://localhost:5183/ → one `GET` request to `http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no import of `package.json` and no version literal such as `0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. From the repository root run `docker compose stop backend` → the backend container stops.
2. Open http://localhost:5183/ and hard-reload (Cmd+Shift+R) → the page renders; the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no blank space after the name.
3. In devtools Network tab → the `/api/version` request shows as failed; the Console shows no uncaught error from the footer.
4. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, and reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Read the run's test list → it includes `renders the version returned by the backend` and `renders exactly the app name when the backend is unreachable`.

### Criterion 5: Before the fetch resolves, the footer reads exactly Task Notes
Prerequisites: as Criterion 1; Chrome devtools.
1. In devtools, Network tab, set throttling to "Slow 3G" (or add a request-blocking delay) and reload http://localhost:5183/ → while `/api/version` is still pending, the footer reads `Task Notes` with no version, no `v`, no "loading" text, and is not blank.
2. Wait for the `/api/version` request to complete → the footer changes to `Task Notes v0.1.0` without a page reload.
3. Reset throttling to "No throttling".
