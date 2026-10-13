# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Acceptance criteria (tracker description):
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> Notes (tracker description): "Frontend only, under `frontend/src/`." Both of these are superseded by the newest tracker comment, recorded under Re-Plan Feedback: the version comes from the backend at runtime.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend's `GET /api/version`, fetched at runtime, so a frontend built against an older backend shows the backend's version, not `frontend/package.json`'s.
- [ ] 3. When the version cannot be resolved (request pending, unreachable, non-OK, or a response without a usable version), the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback (if applicable)
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint ... have the footer fetch it ... Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable ... This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Addressed by: (a) criterion 2 amended above; the footer fetches `GET /api/version` through a new client `frontend/src/api/version.ts` and the `package.json` import is removed from `AppFooter.tsx`. (b) **Backend: the comment's backend change is already on main, so this plan makes none.** `GET /api/version` exists from TEST-05 (`backend/app/routers/version.py`, `schemas/version.py`, `services/version_service.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`), and the CORS middleware already allows `GET` from `http://localhost:5183` (`backend/app/core/config.py`). The item is therefore no longer frontend-only in its dependency (it needs the backend running), but it is frontend-only in its diff; the Backend Plan says so explicitly rather than leaving it implicit. (c) **Loading state (recorded decision): the footer renders `Task Notes` with no version and no placeholder** until the fetch resolves. (d) **Failure state (recorded decision): the footer renders `Task Notes`, identical to the loading state**, when the request rejects, returns non-OK, returns a body whose `version` is not a non-empty string, or returns the backend's own unresolved sentinel `unknown` (`version_service.UNKNOWN_VERSION`). Chosen over a literal `unknown` because criterion 3 says "renders without it", and over a blank footer because the app name stays, so the footer is never empty and carries no dangling `v`. The rendered text is a single string with no trailing space: `Task Notes v0.1.0` or `Task Notes`.
- Comment (tracker): framework PR-link notes from earlier, reset runs (PRs #25, #38, #68, #98) → not acted on because none of that work is on main: verified on 11722a8 that `frontend/src/api/version.ts` does not exist and `AppFooter.tsx` still imports `version` from `../../package.json`.
- Comment (tracker): 2026-09-07 reset note → not acted on: its precondition is already satisfied (DECISIONS.md 2026-09-14).
- Dispatch note: TEST-09 (PR #150, not merged) adds a `commit` string to the `GET /api/version` body → Addressed by: the client reads only `version` and ignores every other field; an E2E case and a unit case serve a body that carries `commit` too.
- Dispatch note: TEST-10 will show the build commit in the footer → Addressed by: the client returns a typed `VersionInfo` object rather than a bare string, so TEST-10 adds one field to the type and one line to the footer. TEST-10 itself is not implemented.
- Dispatch note: BUG-04 (PR #151) edits `NoteForm.tsx`, `NoteForm.test.tsx` and `e2e/tests/BUG-04_double_submit_note.spec.ts` → Addressed by: none of those files is in this manifest, and `LandingPage.tsx` is not modified either (the footer fetches on its own), which clears the feature map's LandingPage.tsx warning.
- Regression found while planning: TEST-04's own tests assert the `frontend/package.json` version (`0.0.0`), while the backend reports `0.1.0` (`backend/pyproject.toml`). `AppFooter.test.tsx`, `LandingPage.test.tsx` and `e2e/tests/TEST-04_page_footer.spec.ts` would go red, and TEST-04's Gherkin and UAT script describe a check that is no longer true. All five are in the manifest and re-pointed at the backend version.
- Merged since the last plan: n/a (fresh plan, branched from current main 11722a8).

## Plan Overview
Replace the build-time `package.json` version in `AppFooter` with a runtime fetch of the backend's `GET /api/version`. One new client module (`frontend/src/api/version.ts`), one small shared module for the API base URL that `notes.ts` and the new client both read (so the deployment-dependent base URL keeps one source), a footer that holds the fetched version in local state, and the TEST-04 tests and artifacts that assert the old source re-pointed. No backend change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, moved verbatim from `notes.ts` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`).
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./baseUrl` instead of defining it. Behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionInfo = { version: string }` and `export async function fetchVersion(): Promise<VersionInfo>`. GETs `API_BASE_URL + "/api/version"`; throws on non-OK (same `requestFailed` message shape as notes.ts, e.g. `Loading the version failed: 503 Service Unavailable`); throws when `version` is missing or not a non-empty string; returns only `{ version }`, ignoring extra fields such as `commit`.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)` plus a `useEffect` calling `fetchVersion()` once with an `isMounted` guard (same pattern as `LandingPage.tsx`); a resolved version equal to `unknown` or a rejected promise leaves state `null`. Render `Task Notes` plus ` v{version}` only when non-null, as one text expression with no trailing space. Keep `<footer data-testid="app-footer">`, the contentinfo landmark and `footerStyle` unchanged.
- Routes: none.
- State management: component-local state in `AppFooter`; no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept exactly (`font-size 0.875rem`, `color #5f5f5f`, `margin-top 1.5rem`); no new visual element is added for loading or failure.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and answers `{"version": "0.1.0"}`; CORS already permits `GET` from the frontend origin. Recorded explicitly because the tracker comment frames this as a backend addition: the dependency is real, the work is already merged.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed here, not changed)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0"}`; after TEST-09 merges, `{"version": "0.1.0", "commit": "abc1234"}`. The client reads `version` only and tolerates any additional field.

## Technology Selection
- Version client (`frontend/src/api/version.ts`): chose the platform `fetch` already used by `notes.ts` over adding an HTTP library, because `fetch` covers a single GET and no HTTP library is installed.
- Footer loading/failure state: chose React `useState` and `useEffect` (installed) over a data-fetching library, because one request on mount needs no cache or retry layer.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers it; it is a move of three existing lines so the deployment-dependent base URL has one source (`coding_standards.md` Section 5) instead of a second copy in `version.ts`.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL`, moved from notes.ts
- [A] frontend/src/api/version.ts: `VersionInfo` type and `fetchVersion()` client for GET /api/version
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (fetch stubbed)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend-served version; stubbed older-backend version wins over package.json; unreachable endpoint renders `Task Notes` only
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl`; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the version at runtime, drop the package.json import, render loading/failure as `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, absent (rejected), loading, `unknown` sentinel, landmark
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; footer assertion uses the mocked backend version instead of package.json
- [D] e2e/tests/TEST-04_page_footer.spec.ts: remove the package.json read; version assertions become the backend-served version so TEST-04 does not go red
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: version step now says it matches GET /api/version, not frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against GET /api/version instead of frontend/package.json

No dependency is added or changed, so no lockfile changes. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit. Not modified on purpose: frontend/src/components/LandingPage.tsx (shared-risk with BUG-04 and TEST-10) and every backend file.

## Testing Strategy
- Unit tests (Vitest, frontend): `version.test.ts` stubs `fetch` like `notes.test.ts`: returns `{ version }` from a `200`; ignores an extra `commit` field; throws with status and reason on non-OK; throws on a body without a string `version` and on an empty string; requests `http://localhost:8010/api/version` by default and the `VITE_API_BASE_URL` base when set. `AppFooter.test.tsx` mocks `../api/version`: present (`1.2.3` gives exactly `Task Notes v1.2.3`), absent on rejection (text is exactly `Task Notes`, contains neither `undefined`, `null` nor ` v`), loading (never-resolving promise gives exactly `Task Notes`), backend sentinel `unknown` gives exactly `Task Notes`, contentinfo landmark with `data-testid="app-footer"`. `notes.test.ts` must keep passing unchanged after the base URL move.
  - Directory: frontend/src/ (co-located `*.test.ts(x)`, the existing frontend convention; CLAUDE.md's unit directory is the backend's)
  - Naming: `{module}.test.ts(x)`
- Integration tests: no new ones. No router, repository or migration changes; the consumed endpoint is already covered by `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: `TEST-08_footer_app_version.spec.ts`. (1) Real stack: wait for the page's `GET /api/version` response (match on pathname, as TEST-03's spec does), read its `version`, assert the footer reads `Task Notes v{that version}`. (2) `page.route` fulfils `/api/version` with `{"version": "9.9.9-backend", "commit": "abc1234"}`: footer shows `9.9.9-backend` and does not contain the package.json version. (3) Edge: `page.route` aborts `/api/version`: footer text is exactly `Task Notes`. `TEST-04_page_footer.spec.ts` keeps its four tests, with the version expectation taken from the observed `/api/version` response instead of package.json.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend's GET /api/version at runtime, never typed into the component or read from package.json | E2E | — |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or empty gap) | Unit | verifying it needs no navigation or interaction: it is a render branch on a rejected or pending client promise, checked in jsdom; the E2E abort case is the feature's edge-case spec on top |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test, so it is satisfied and verified by `AppFooter.test.tsx` running |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Real stack: footer contains `Task Notes v` plus the version the page's own /api/version response carried | Given the app runs, When I open the landing page, Then the footer reads "Task Notes v" and a version |
| 2 | Version from backend at runtime | Stub /api/version with `9.9.9-backend` and a `commit` field: footer shows `9.9.9-backend`, not `0.0.0` | Given the backend reports a version different from frontend/package.json, When I open the page, Then the footer shows the backend's |
| 3 | Unresolvable version omitted | covered at Unit, see Criterion coverage; E2E edge case aborts /api/version and expects exactly `Task Notes` | Given the backend is stopped, When I open the page, Then the footer reads "Task Notes" with no version, "undefined", "null" or trailing "v" |
| 4 | Component test, both paths | covered at Unit, see Criterion coverage | Given the frontend tests, When I run them, Then AppFooter's present and absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: stack running from the repository root with `docker compose up --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open `http://localhost:8010/api/version` in a browser tab → JSON whose `version` is `0.1.0` (the value of `[project].version` in `backend/pyproject.toml`); note it.
2. Open `http://localhost:5183/` → the landing page with the title "Task Notes" loads.
3. Scroll to the footer under the note list → it reads exactly `Task Notes v0.1.0` (the value from step 1).

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as Criterion 1; `frontend/package.json` shows `"version": "0.0.0"`.
1. Open `http://localhost:5183/` with dev tools' Network tab open, then reload → a `GET http://localhost:8010/api/version` request with status `200` appears.
2. Read the footer → it shows `v0.1.0`, the backend's version, and not `v0.0.0` from `frontend/package.json`.
3. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. Run `docker compose stop backend` from the repository root → the backend container stops.
2. Reload `http://localhost:5183/` → the page still loads; the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null` and no trailing gap.
3. Run `docker compose start backend`, wait for it to be up, and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the version-present and version-absent tests are listed, with `0 failed`.
2. Run `npm --prefix frontend test` → the full frontend suite, including `src/api/version.test.ts`, `src/api/notes.test.ts` and `src/components/LandingPage.test.tsx`, reports `0 failed`.
