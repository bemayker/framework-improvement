# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description)**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> Source: ClickUp task 123k99ctgch (workspace 30307190, list 901524718831). The tracker correction comment (see Re-Plan Feedback) overrides criterion 2 and the "frontend only" note; the criteria below are the amended ones.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend, at runtime: the footer fetches `GET /api/version` and shows the version the backend reports (its `[project].version` in `backend/pyproject.toml`, via package metadata). It is never a string typed into a component and never read from `frontend/package.json`, so a frontend served against a backend of a different version shows the backend's version. (Amended by the tracker correction comment.)
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap. This covers three states, decided here as the comment asks: while the request is pending (loading), when `/api/version` is unreachable or answers non-OK or with an unexpected body (failure), and when the backend itself answers its own `unknown` sentinel. In all three the footer reads exactly `Task Notes`: no `v`, no placeholder, no trailing space.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts a9695cc (with 8794a99 and ffbfc12) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged. ..." → Addressed by: verified against main at plan base 02cd3e5 rather than assumed. a9695cc is still an ancestor of main, but its code is no longer on main: 591779e (chore: reset Arm E code to 36e231a, #807) removed TEST-08's later build (frontend/src/api/version.ts, version.test.ts, the TEST-08 spec and UAT files) and restored AppFooter.tsx to TEST-04's package.json import, which is what HEAD holds today (`import { version } from "../../package.json"`). `e2e/tests/TEST-08_footer_app_version.spec.ts`, `frontend/src/api/version.ts` and `.claude/artifacts/TEST-08/` do not exist on main. The precondition (TEST-08's code absent, TEST-04's footer assertion as it was) is therefore met in effect, by a different reset commit than the comment names; this plan builds from that state. The note that TEST-08 touches LandingPage.tsx does not carry over: this plan leaves `frontend/src/components/LandingPage.tsx` unchanged (see Shared risks).
- Comment (tracker, older): "Correction to the description ... The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it." → Addressed by: criterion 2 rewritten; the footer fetches `GET /api/version` through a new client `frontend/src/api/version.ts`, and the `package.json` import is removed from AppFooter.tsx. The endpoint the comment asks for already exists on main: TEST-05 (a declared dependency of this item, complete) shipped `backend/app/routers/version.py`, `services/version_service.py` and `schemas/version.py`, answering `{"version": "<pyproject version>"}` and covered by `backend/tests/integration/test_version_integration.py`. CORS already admits the frontend origin (`DEFAULT_CORS_ORIGINS = ("http://localhost:5183",)` in `backend/app/core/config.py`, `CORS_ORIGINS` in docker-compose.yml). So no backend file is added or edited; adding a second version endpoint would duplicate TEST-05.
- Comment (tracker, older), "The footer now has a loading state and a failure state. Decide and record what it shows" → Addressed by: decided in criterion 3 and the Frontend Plan. Loading: `Task Notes` (name only, no placeholder text, so the footer does not flash "loading" and then change). Failure: `Task Notes` (name only), not `Task Notes vunknown` and not a blank footer. Chosen because the description's own criterion 3 already says an unresolved version renders "without it", and a reader who sees no version knows no version was resolved, while `unknown` reads like a real version string. The backend's own `unknown` sentinel (version_service.py `UNKNOWN_VERSION`) is treated the same way, since it is the backend saying it could not resolve the version.
- Comment (tracker, older), "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Addressed by: said here and in Backend Plan. The item is no longer frontend-only in what it depends on at runtime: the footer's value now comes from the backend's `GET /api/version`. It is still frontend-only in what this branch edits, because the backend half is TEST-05's existing endpoint; the File Manifest has no `[B]` entry for that reason, not by omission.
- Assumption: the version client does not retry and sets no timeout of its own. The footer is informational, the request is to this project's own backend (not an external API, so `coding_standards.md` Section 4's retry and timeout bullets, which scope to external APIs, do not bind), and a failed request already lands on the name-only footer.
- Assumption: the API base URL (`VITE_API_BASE_URL` with default `http://localhost:8010`) moves from `frontend/src/api/notes.ts` into a shared `frontend/src/api/config.ts` so the notes and version clients read one value from one source (`coding_standards.md` Section 5, "One value, one source"), rather than repeating the default in a second client.
- Merged since the last plan: n/a (first plan on this plan base, 02cd3e5; no existing plan for TEST-08 on main and no `[merged-since]` lines in the dispatch).

## Plan Overview
Frontend change plus test updates. A new typed client `getBackendVersion()` fetches `GET /api/version` from the existing backend endpoint (TEST-05) and resolves to the version string, or to `null` when the version cannot be resolved. `AppFooter` calls it once on mount and renders `Task Notes v{version}` when it resolves, or `Task Notes` alone while loading and on failure. The `frontend/package.json` import leaves the footer. Existing tests that asserted the frontend package version (AppFooter.test.tsx, LandingPage.test.tsx, the TEST-04 E2E spec and TEST-04's UAT files) are updated to the backend-sourced version. No backend files change; `LandingPage.tsx` does not change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, read from `import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010` (moved from notes.ts, unchanged behaviour).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` instead of declaring it; no other change.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string | null>`. `fetch(`${API_BASE_URL}/api/version`)`; returns the `version` field when the response is OK and the body is an object whose `version` is a non-empty string other than the backend's `unknown` sentinel; returns `null` on a rejected fetch (network error), a non-OK status, a JSON parse failure, or any other shape. It never throws, so the component needs no catch of its own. Type `VersionResponse = { version: string }`.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `const [version, setVersion] = useState<string | null>(null)`; `useEffect` calls `getBackendVersion()` once and sets it, guarded by an `isMounted` flag like LandingPage.tsx's notes load. Render `{APP_NAME}` and, only when `version` is non-null, ` v{version}` inside `<span data-testid="app-footer-version">`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified (AppFooter fetches its own version, so the page needs no new wiring).
- Routes: none.
- State management: local `useState` in AppFooter; no global state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing TEST-04 style values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required. The backend half of this item is `GET /api/version`, which already exists on main from TEST-05 (a declared dependency of TEST-08): `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "0.1.0"}` today (the `[project].version` of `backend/pyproject.toml`) or `{"version": "unknown"}` when package metadata is missing. The frontend now depends on it at runtime, which is the backend dependency the tracker comment asked to be named; this branch adds no backend file.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05), called as `${API_BASE_URL}/api/version`
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}`. The backend answers `{"version": "unknown"}` when it cannot resolve its own version; the client maps that to `null`.
- Client contract: `getBackendVersion(): Promise<string | null>`; `null` means "no version resolved" and is never rendered.

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the platform `fetch` already used by `frontend/src/api/notes.ts` over adding an HTTP library (axios or similar); no new dependency.
- Footer loading and failure state: chose React's built-in `useState` and `useEffect`, as LandingPage.tsx already does for notes, over a data-fetching library (React Query, SWR), which a single one-shot request does not need.
- Shared base URL (`frontend/src/api/config.ts`): chose a two-line module reading Vite's built-in `import.meta.env` over a config library; no alternative dependency considered necessary.
- E2E expected-version helper (`e2e/helpers/backendVersion.ts`): chose Node's standard library (`node:fs` read of `backend/pyproject.toml` plus a regular expression for the `[project]` `version` line), the same approach the TEST-04 spec uses for package.json, over adding a TOML parser dependency to the root package.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source for API_BASE_URL (VITE_API_BASE_URL, default http://localhost:8010), shared by the notes and version clients
- [A] frontend/src/api/version.ts: getBackendVersion() client for GET /api/version, returns the version string or null
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (fetch stubbed): success, non-OK, network error, unknown sentinel, unexpected body, configured base URL
- [D] e2e/helpers/backendVersion.ts: reads the expected version from backend/pyproject.toml for the E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version; footer shows only the app name when /api/version fails
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./config instead of declaring it locally
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend on mount; render name only while loading and on failure; drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert version present, loading, and absent (failure) paths; keep the name and landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected footer version now comes from backend/pyproject.toml via the helper, not frontend/package.json
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now matches the backend version, not frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare against backend/pyproject.toml (or GET /api/version), not frontend/package.json

No dependency manifest changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test infrastructure change (the new files sit in the existing api/, helpers/, tests/ and uat/ directories).

Frontend files this item touches, exactly: frontend/src/api/config.ts, frontend/src/api/version.ts, frontend/src/api/version.test.ts, frontend/src/api/notes.ts, frontend/src/components/AppFooter.tsx, frontend/src/components/AppFooter.test.tsx, frontend/src/components/LandingPage.test.tsx. Not frontend/src/components/LandingPage.tsx.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, fetch stubbed as in notes.test.ts) and the footer component (`frontend/src/components/AppFooter.test.tsx`, `../api/version` mocked); LandingPage.test.tsx updated so its footer assertion uses the mocked backend version. Backend unit tests are unchanged (no backend code changes).
  - Directory: co-located under frontend/src/ (project-standards.md Naming: `{Name}.test.tsx` / `{module}.test.ts`); backend unit directory backend/tests/unit/ is not touched
  - Naming: `{module}.test.ts`, `{Name}.test.tsx`
- Integration tests: no new integration tests: no endpoint, repository or model changes. The existing `backend/tests/integration/test_version_integration.py` (TEST-05) already covers the endpoint this feature consumes and is cited as coverage for criterion 2's backend half.
  - Directory: backend/tests/integration/
- E2E tests: one happy-path spec (footer shows the version the real backend reports) and one edge-case spec (`page.route` fulfils `**/api/version` with 503, footer reads exactly `Task Notes`). TEST-04's spec is updated to the backend-sourced version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus an edge case (backend unreachable).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `footer shows the version the backend reports` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never typed into a component or read from package.json | Unit | `requests GET /api/version from the default API base URL`, `uses VITE_API_BASE_URL instead of the default when it is configured`, `returns the version the backend reports`, `renders the version returned by the backend client` | verifying the source needs no navigation or interaction: it is the client's request URL and the component's use of the client's value, both checked in isolation; the endpoint itself is already covered by the TEST-05 integration test `test_get_version_returns_200_with_version_from_pyproject` |
| 3 | When the version cannot be resolved (loading, failure, unknown sentinel) the footer reads exactly Task Notes | Unit | `renders only the app name while the version is loading`, `renders only the app name when the version cannot be resolved`, `returns null when the response is not OK`, `returns null when the request fails`, `returns null when the backend reports the unknown sentinel`, `returns null when the body has no string version` | verifying it needs no navigation or interaction: it is a rendering rule on a mocked client value and a mapping rule in the client; the E2E edge spec `footer shows only the app name when the version endpoint fails` adds browser confirmation but is not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by the backend client`, `renders only the app name when the version cannot be resolved` | the criterion is itself a component-test requirement: it is met by the component tests existing and passing, which no browser run adds to |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Load `/`, read `app-footer`, expect it to contain `Task Notes v` plus the version from backend/pyproject.toml (helper) | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports version X and the frontend package.json says 0.0.0, When I open the landing page, Then the footer shows X |
| 3 | Unresolved version renders name only | covered at Unit, see Criterion coverage; E2E edge spec fulfils /api/version with 503 and expects exactly `Task Notes` | Given /api/version is unreachable, When I open the landing page, Then the footer reads "Task Notes" with nothing after it |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d` from the repository root (backend on http://localhost:8010, frontend on http://localhost:5183); `backend/pyproject.toml` says `version = "0.1.0"` at the time of writing (read the file for the current value).
1. Open http://localhost:5183/ in a browser → the landing page shows the heading "Task Notes" and the note form.
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0` (the version from `backend/pyproject.toml`), in small grey text.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as for Criterion 1.
1. Open http://localhost:8010/api/version in a browser tab → the JSON `{"version":"0.1.0"}` is shown.
2. Open `frontend/package.json` → its `version` field reads `0.0.0`, which differs from the backend's.
3. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, the backend's version, not `0.0.0`.
4. Open the browser's developer tools, Network tab, and reload the page → a GET request to `http://localhost:8010/api/version` is listed with status 200.
5. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no import of `package.json`.

### Criterion 3: An unresolved version renders the name only
Prerequisites: as for Criterion 1.
1. With the page open at http://localhost:5183/, run `docker compose stop backend` from the repository root → the command reports the backend container stopped.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes`: no `v`, no `undefined`, `null` or `unknown`, and no trailing gap after the name.
3. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, and reload the page → the footer reads `Task Notes v0.1.0` again.
4. Loading state: in the developer tools Network tab set throttling to "Slow 3G" and reload → until the `/api/version` request completes the footer reads `Task Notes`, then changes to `Task Notes v0.1.0` with no intermediate placeholder text.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test named `renders the version returned by the backend client` (version present) and one named `renders only the app name when the version cannot be resolved` (version absent).
