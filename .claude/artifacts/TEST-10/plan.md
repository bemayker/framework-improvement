# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable (the run's decisions log records 0 actionable tracker comments, only prior run PR notices) → nothing to address.
- Merged since the last plan: n/a (fresh plan, planned against main b2bd3d7, where TEST-08's footer and TEST-09's `commit` field are both merged).
- Interpretation of criterion 2 against TEST-08's recorded states (assumption, recorded rather than blocking): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending, and when it fails, there is no version to show either. TEST-08 recorded those two states as the footer reading exactly `Task Notes`. This plan reads "the version alone" as "the footer exactly as TEST-08 renders it, without a commit": pending and failure keep TEST-08's `Task Notes` text unchanged (never `undefined`, `null`, `unknown`, an error message or an empty `()`), and a successful response that carries no usable commit renders `Task Notes v{version}` with no commit. The alternative reading (show a version while the request is pending) is not implementable without a second source for the version, which TEST-08's tracker correction ruled out (the version is the backend's, at runtime).
- The commit sentinel (assumption): TEST-09's backend answers `"commit": "unknown"` when `BUILD_COMMIT` is unset or blank, which is the default in `docker-compose.yml` (`${BUILD_COMMIT:-unknown}`) and therefore in CI's E2E stack. `"unknown"` is not a commit, so criterion 1 does not ask to show it; the client treats it like a missing commit (`null`), exactly as TEST-08 treats the version's own `"unknown"` sentinel, and the footer shows the version alone. A response with a missing, non-string or blank `commit` is treated the same way rather than failing the whole footer, so the version TEST-08 shows is never lost because of the commit. BUG-03 ("Footer sometimes shows 'unknown' instead of the build commit", depends on TEST-10) should be verified against this behaviour when it is planned; this plan does not claim to have fixed whatever "sometimes" refers to.
- Display format (assumption, the criterion says only "next to the version"): `Task Notes v0.1.0 (0123456)`, i.e. a space and the 7-character commit in parentheses after the version. The commit is shown only next to a version: when the backend reports the version sentinel (`version` resolves `null`) the footer stays `Task Notes`, as TEST-08 recorded, even if a commit is present.
- Where the cut to 7 characters lives: in `AppFooter.tsx` (a display concern), not in the client and not in the backend, which keeps serving 12 characters per TEST-09.
- Concurrency (from the dispatch): BUG-04 builds in `frontend/src/components/NoteForm.tsx`, `NoteForm.test.tsx` and its own e2e/UAT files; this plan touches none of them. `LandingPage.tsx` is not modified; only `LandingPage.test.tsx` changes, because it mocks the version client whose return shape changes.

## Plan Overview
Frontend-only change against the existing `GET /api/version` endpoint (TEST-05, extended with `commit` by TEST-09). The client `frontend/src/api/version.ts` keeps its single request but returns both fields: `fetchBackendVersion(): Promise<BackendVersion>` with `BackendVersion = { version: string | null; commit: string | null }`. `AppFooter.tsx` stores that object (initially `null`), and renders `Task Notes v{version} ({first 7 of commit})` when both are present, `Task Notes v{version}` when only the version is present, and `Task Notes` while pending, on failure and for the version sentinel. The component tests cover success, pending and failure; the client tests cover the commit parsing. TEST-08's E2E happy-path spec, which asserts the footer's exact text, is loosened to accept an optional commit suffix so it stays true on a stack where `BUILD_COMMIT` is set. No backend, database, dependency or configuration change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit?: string }`; add `export type BackendVersion = { version: string | null; commit: string | null }`. `fetchBackendVersion()` returns `Promise<BackendVersion>`. Version handling is unchanged (non-OK response throws `Loading the version failed: {status} {statusText}`; missing, non-string or blank `version` throws `Loading the version failed: unexpected response`; `"unknown"` maps to `null`; otherwise trimmed). Commit handling is new and never throws: a string `commit`, trimmed, non-empty and not `"unknown"` is returned as is (full length, as served); anything else is `null`. One request, as today.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`; the existing `isMounted` effect sets the resolved object and leaves `null` on rejection. Add `const SHORT_COMMIT_LENGTH = 7`. Text: no state or no `version` → `Task Notes`; `version` and no `commit` → `Task Notes v{version}`; both → `Task Notes v{version} ({commit.slice(0, SHORT_COMMIT_LENGTH)})`. Keep the `<footer>` element, `data-testid="app-footer"` and `footerStyle` unchanged.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer styling is unchanged from TEST-08: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the commit is plain text in the same run of text, no new style.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": ..., "commit": ...}` on main (TEST-09: `backend/app/schemas/version.py`, `backend/app/services/version_service.py` cuts `BUILD_COMMIT` to 12 characters, `"unknown"` when unset).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL` from `frontend/src/api/baseUrl.ts`, default `http://localhost:8010`, overridable by `VITE_API_BASE_URL`)
- Request: no body, no query parameters.
- Response: 200, `{"version": "0.1.0", "commit": "0123456789ab"}` (commit is up to 12 characters; `"unknown"` when the backend has no `BUILD_COMMIT`). The client maps it to `{ version: "0.1.0", commit: "0123456789ab" }`; `"unknown"` in either field maps to `null`; a missing or blank `commit` maps to `null`.

## Technology Selection
- No net-new component, module or dependency: the change extends the existing `frontend/src/api/version.ts` client (native `fetch`) and `AppFooter.tsx` (React `useState`/`useEffect`), and the 7-character cut is the standard `String.prototype.slice`, chosen over any formatting helper or library.
- Tests: Vitest and Testing Library (installed) for the client and component tests, Playwright (installed) for the adjusted TEST-08 spec; no new dependency.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the commit-sentinel edge case.
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan.
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes.

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` from the one request; parse `commit` tolerantly (sentinel, missing or blank become `null`).
- [A] frontend/src/api/version.test.ts: update expectations to the object shape; add commit cases (present, `"unknown"`, missing, non-string, blank, whitespace trimmed); keep the existing version, error and base-URL cases.
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit next to the version; version alone when no commit; `Task Notes` while pending, on failure and for the version sentinel.
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve `BackendVersion` objects; success (`Task Notes v9.9.9 (0123456)` from a 12-character commit), success without commit, pending, rejected and version-sentinel paths, each free of `undefined`, `null`, `unknown` and `()`.
- [A] frontend/src/components/LandingPage.test.tsx: the version mock resolves `{ version: "9.9.9", commit: "0123456789ab" }` and the footer assertion expects `Task Notes v9.9.9 (0123456)` on the landing page.
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the happy-path assertion accepts an optional ` ({7 characters})` suffix after `Task Notes v{backendVersion}` instead of the exact text, so it holds on a stack where `BUILD_COMMIT` is set; the unreachable-backend case stays exactly `Task Notes`.

No dependency is added or changed, so no lockfile changes. `README.md` and `docs/DEVELOPMENT.md` need no edit: no project structure, run configuration, dependency or test infrastructure changes (`BUILD_COMMIT` is already documented in `.env.example` by TEST-09).

## Testing Strategy
- Unit tests: `version.ts` client with `fetch` stubbed: object shape returned; commit present returned in full; commit `"unknown"`, missing, non-string or blank resolves `commit: null` without throwing; version rules unchanged (sentinel `null`, non-OK and malformed-version throw, network rejection propagates, configured base URL). `AppFooter` component tests with `../api/version` mocked: resolved with version and 12-character commit renders exactly `Task Notes v9.9.9 (0123456)`; resolved with `commit: null` renders exactly `Task Notes v9.9.9`; pending promise renders exactly `Task Notes`; rejected renders exactly `Task Notes`; `version: null` renders exactly `Task Notes`; none contain `undefined`, `null`, `unknown` or `()`. `LandingPage` test shows the commit in the footer on the landing page.
  - Directory: co-located with the code under `frontend/src/` (the project's existing Vitest convention, e.g. `frontend/src/api/version.test.ts`); `backend/tests/unit/` is not touched.
  - Naming: `{Module}.test.ts(x)`, as the existing frontend tests.
- Integration tests: none added. No backend code changes; `GET /api/version` with `commit` is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: no new spec, because no criterion's covering tier is E2E (table below). TEST-08's existing spec is adjusted so its exact-text assertion tolerates the commit suffix; CI's stack leaves `BUILD_COMMIT` unset, so there it still sees `Task Notes v0.1.0`.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts (modified)
- UAT scenarios: one scenario per criterion plus the commit-sentinel edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version. | Unit | Verifying it needs no navigation or interaction: it is the footer's rendering of a resolved response, driven deterministically by a mocked client (AppFooter and LandingPage tests), plus the client test that reads `commit` from the `/api/version` body; a browser run would need `BUILD_COMMIT` set on the stack, which CI does not do. |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | Verifying it needs no navigation or interaction: pending and rejected promises from the mocked client reproduce both states exactly; TEST-08's E2E edge-case spec already checks the aborted-request footer in the browser. |
| 3 | A component test covers the success, pending and failure paths. | Unit | The criterion names the component test itself as the deliverable; `AppFooter.test.tsx` is it. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 0123456789abcdef, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows the version alone | covered at Unit, see Criterion coverage | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they report 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version.
Prerequisites: from the repository root, start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`; the backend answers on `http://localhost:8010` and the frontend on `http://localhost:5183`.
1. Open `http://localhost:8010/api/version` in a browser tab → it shows `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters of the commit).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and the footer at the bottom.
3. Read the footer text → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses.
4. Restart the backend without a commit (`docker compose up -d --build backend` with `BUILD_COMMIT` unset) and reload `http://localhost:5183/` → `/api/version` reports `"commit":"unknown"` and the footer reads exactly `Task Notes v0.1.0`, with no `unknown` and no empty parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from Criterion 1 is running with `BUILD_COMMIT=0123456789abcdef`.
1. Open `http://localhost:5183/`, open the browser developer tools, Network tab, set throttling to "Slow 3G" and reload → while the `/api/version` request is pending the footer reads exactly `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (0123456)`.
2. Stop the backend (`docker compose stop backend`) and reload `http://localhost:5183/` → the page renders and the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, error text or parentheses.
3. Start the backend again (`docker compose start backend`) and reload → the footer reads `Task Notes v0.1.0 (0123456)` again.

### Criterion 3: A component test covers the success, pending and failure paths.
This criterion is verified by running tests, not through the UI.
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` → the run reports `0 failed`, and the AppFooter test names include a success case with a commit, a pending case and a rejected-fetch case.
