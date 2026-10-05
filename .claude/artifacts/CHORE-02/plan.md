# Implementation Plan, CHORE-02: TEST-08 follow-up: known-improvements

## Feature
> ## Known improvements (verbatim from the merged pull request)
> - OPTIONAL: `frontend/src/api/version.ts:17` has no fetch timeout — a backend that accepts the connection but never answers leaves the footer in the loading state rather than "version unavailable". Possible fix: `AbortSignal.timeout(...)` on the fetch.
> - Out of scope, noted by the reviewer: TEST-01 and TEST-03 UAT files also name the stale ports 5173/8000.
> Source pull request: https://github.com/bemayker/framework-improvement/pull/98

Tracker: ClickUp 123k99cx6mf (chore, filed by run deliver-20261005T151552Z). Depends on TEST-08 (done). Tracker comments: 0. Merged-since check: n/a (fresh plan, no prior plan for this item).

## Acceptance Criteria
- [ ] 1. A `/api/version` request the backend accepts but never answers resolves the footer to its existing "version unavailable" state after a bounded timeout, instead of staying in the loading state. The timeout value is declared once, in `frontend/src/api/version.ts`, and a unit test proves the abort path without waiting in real time.
- [ ] 2. The TEST-01 and TEST-03 UAT files (scenarios and manual scripts) name the ports `docker-compose.yml` actually publishes (frontend 5183, backend 8010, PostgreSQL 5442) instead of 5173 / 8000 / host 5432. Text only: no step is added, removed or reworded beyond the port.

## Assumptions
The item is a list of reviewer notes, not criteria, so the criteria above are derived (recorded per `user_story_alignment.md` Section 4, autonomous mode):
1. Both bullets are in scope. The first is tagged OPTIONAL and the second "Out of scope" on the source PR; that is relative to TEST-08, and this chore exists to carry them out.
2. Timeout value: **5000 ms** (`VERSION_REQUEST_TIMEOUT_MS = 5_000`). Reason: the backend answers `/api/version` locally in milliseconds, so 5 s leaves wide headroom for a cold container or slow machine without false "unavailable" readings, while a user who watches the footer sees it settle within one short glance rather than never. The footer is non-critical decoration, so a longer wait buys nothing.
3. The timeout lives in the client (`version.ts`), not in `AppFooter.tsx`. A timeout abort makes `fetch` reject, and `AppFooter`'s existing `.catch` already maps any rejection to "unavailable" (covered today by the `AppFooter.test.tsx` case "renders without a version when the request fails"). So `AppFooter.tsx` is not modified.
4. "Stale ports" covers the host-side PostgreSQL port too: the TEST-03 script names host `5432` in the same sentence as 5173/8000 and in its pytest step, and compose publishes `5442:5432`. A container-internal `5432` (e.g. `db:5432`) is correct and is not touched; neither TEST-01 nor TEST-03 file contains one.
5. **`frontend/src/api/notes.ts` does not get the same timeout.** Its two `fetch` calls have the same theoretical gap, but the item names only `version.ts`; adding it would be gold plating (`user_story_alignment.md` Section 3). Recorded here as a candidate follow-up, not acted on.
6. Other stale-port mentions found on `origin/main` are out of scope and untouched: `e2e/uat/scripts/BUG-01_server-time-edge-cache_uat_script.md` (port 8000; not named by the item) and `docs/issues/TEST-01.md` (5173, inside the closed item's own acceptance-criterion text, which is a historical record).

## Plan Overview
Frontend-only chore plus a text fix in four existing UAT files. One constant and one `signal` argument in the version API client, one updated and one new Vitest case, and port numbers corrected in the TEST-01 / TEST-03 Gherkin and manual scripts. No backend, API, dependency or configuration change.

## Frontend Plan
- Components to create/modify: `frontend/src/api/version.ts` only.
  - Add `export const VERSION_REQUEST_TIMEOUT_MS = 5_000;` with a one-line "why" comment (the reason in Assumption 2), next to `UNKNOWN_BACKEND_VERSION`.
  - Change the fetch to `fetch(`${API_BASE_URL}/api/version`, { signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS) })`.
  - Update the JSDoc: it throws when the backend could not be reached, read, **or did not answer within `VERSION_REQUEST_TIMEOUT_MS`**.
  - Nothing else in the function changes; the abort rejection propagates unchanged (no catch/rethrow added).
- `frontend/src/components/AppFooter.tsx`: not modified (Assumption 3).
- Routes: none.
- State management: unchanged (`AppFooter`'s existing loading / ready / unavailable union).
- Design reference notes: AI freestyle (Design Reference mode NONE; no visual change in this item).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Unchanged. The frontend still calls `GET /api/version` (no request body) and reads `version` from a response such as `{"version": "0.1.0", "commit": "abc123"}`. The only change is client-side: the request is aborted after `VERSION_REQUEST_TIMEOUT_MS` (5000 ms), after which `getBackendVersion()` rejects with the platform's `TimeoutError` `DOMException`.

## Technology Selection
- Request timeout in `version.ts`: chose the native platform feature `AbortSignal.timeout(ms)` passed as `fetch`'s `signal` over a hand-built `AbortController` plus `setTimeout` / `clearTimeout` pair, and over adding a dependency with a timeout option (e.g. axios). The native call covers the need in one expression with no timer to clean up; no new dependency.
- Timeout test: chose Vitest's built-in `vi.spyOn` (already installed, `vitest ^2.1.3`) on `AbortSignal.timeout` returning an `AbortController`'s signal the test aborts itself, over `vi.useFakeTimers()`. Fake timers are not guaranteed to drive the timer inside jsdom's / Node's `AbortSignal.timeout` implementation, so a fake-timer test could hang or pass vacuously; the aborting mock is deterministic and runs in milliseconds.
- UAT port fixes: no net-new component, module or dependency (text edits).

## File Manifest
<!-- Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=- -->
### New files
- [G] e2e/uat/scenarios/CHORE-02_test_08_follow_up.feature: Gherkin scenarios, one per criterion plus the edge case (backend recovers after a timeout, next load shows the version)
- [G] e2e/uat/scripts/CHORE-02_test_08_follow_up_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/CHORE-02/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: declare `VERSION_REQUEST_TIMEOUT_MS = 5_000` once and pass `signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS)` to the fetch; JSDoc names the timeout
- [A] frontend/src/api/version.test.ts: update the URL assertion for the new second argument; add the timeout cases (see Testing Strategy)
- [G] e2e/uat/scenarios/TEST-01_static_landing_page.feature: `http://localhost:5173` to `http://localhost:5183` (lines 8, 12, 26)
- [G] e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md: ports `5173` to `5183` and `8000` to `8010` (prerequisites line 8, setup step 2, steps 1 and 5)
- [G] e2e/uat/scenarios/TEST-03_simple_note_form.feature: `http://localhost:5173` to `http://localhost:5183` (lines 8, 30)
- [G] e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md: `5173` to `5183`, `8000` to `8010`, host PostgreSQL `5432` to `5442` (prerequisites line 8, setup step 2, steps 1, 10 and 13, including the `DATABASE_URL` in step 13 and its explanatory note)

No dependency changes, so no lockfile is regenerated. No `README.md` or `docs/DEVELOPMENT.md` edit: this item changes no project structure, run configuration, dependency or test infrastructure (the ports already live in `docker-compose.yml` and `vite.config.ts`; only stale UAT text is corrected).

## Testing Strategy
- Unit tests (Vitest, frontend): `frontend/src/api/version.test.ts`, extending the existing file (frontend tests are co-located `*.test.ts(x)` in this project; the `backend/tests/unit/` convention in CLAUDE.md is the backend's).
  1. Update the existing "calls /api/version on the default base URL" case: `toHaveBeenCalledWith(DEFAULT_VERSION_URL, expect.objectContaining({ signal: expect.any(AbortSignal) }))`.
  2. New: "aborts the request after VERSION_REQUEST_TIMEOUT_MS". `vi.spyOn(AbortSignal, "timeout")` returns the signal of a test-owned `AbortController`; `fetchMock` returns a promise that never resolves and rejects with `signal.reason` when that signal fires `abort` (the hung-backend shape). Assert `AbortSignal.timeout` was called with the imported `VERSION_REQUEST_TIMEOUT_MS`, abort the controller with `new DOMException("timed out", "TimeoutError")`, and assert `getBackendVersion()` rejects with a `TimeoutError`.
  3. New (edge): `VERSION_REQUEST_TIMEOUT_MS` is a positive finite number no larger than 10000, so a later edit cannot set it to 0 (instant failure) or remove the bound.
  Restore the spy in `afterEach` (`vi.restoreAllMocks()`) next to the existing `vi.unstubAllGlobals()`.
  The footer half of criterion 1 (rejection renders "Task Notes · version unavailable") is already covered by the existing `AppFooter.test.tsx` case "renders without a version when the request fails"; it stays as is and must still pass.
- Integration tests: not warranted, no repository, model, migration or router change (Integration Tests ENABLED, nothing to integrate).
- E2E tests: not warranted. Neither criterion needs navigation or interaction: criterion 1 is a client-library timeout plus an already-tested rejection mapping, and a browser spec would have to hold a route open for the full 5 s timeout on every run; criterion 2 is text. No `e2e/tests/CHORE-02_*.spec.ts` is written.
- UAT scenarios: `e2e/uat/scenarios/CHORE-02_test_08_follow_up.feature`, one scenario per criterion plus the recovery edge case; validated for well-formedness in CI. The edited TEST-01 / TEST-03 `.feature` files go through the same validation.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Hung `/api/version` resolves the footer to "version unavailable" after a bounded, once-declared timeout | Unit | Verifying it needs no navigation or interaction: the timeout is a client-library behaviour (`version.test.ts` aborting mock) and the rejection-to-"unavailable" mapping is a component behaviour already unit-tested in `AppFooter.test.tsx` |
| 2 | TEST-01 / TEST-03 UAT files name 5183 / 8010 / 5442 instead of 5173 / 8000 / host 5432 | Static check (review-time `git grep -n -E "localhost:(5173|8000|5432)|5173|8000" e2e/uat/scenarios/TEST-0[13]_* e2e/uat/scripts/TEST-0[13]_*` returns no match) plus CI Gherkin well-formedness validation of the two edited `.feature` files | Verifying it needs no navigation or interaction: it is documentation text with no runtime behaviour, so no test tier executes it; a grep is the observable check |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Hung version request resolves to "version unavailable" | covered at Unit, see Criterion coverage | Given the backend container is paused, When I load the app, Then within about 5 seconds the footer reads "Task Notes · version unavailable" |
| 2 | TEST-01 / TEST-03 UAT files name the compose ports | covered at Static check, see Criterion coverage | Given the stack runs via `docker compose up`, When I follow the TEST-01 and TEST-03 UAT files as written, Then every URL and port they name reaches the running service |
| edge | Backend recovers after a timeout | covered at Unit (existing happy-path case) | Given the footer showed "version unavailable" after a timeout, When the backend is unpaused and I reload, Then the footer shows "Task Notes v{version}" |

## Manual verification plan
### Criterion 1: a hung `/api/version` request resolves the footer to "version unavailable"
Prerequisites: from the repository root, `docker compose up --build` is running and `db`, `backend` and `frontend` are started; nothing else is bound to host ports 5183, 8010 or 5442.
1. Open `http://localhost:5183` in a browser → the footer at the bottom of the landing page reads `Task Notes v0.1.0` (or whatever `curl -s http://localhost:8010/api/version` reports as `version`).
2. In a terminal at the repository root, run `docker compose pause backend` → the command prints that `backend` is paused; the port stays published, so connections are accepted but never answered.
3. Open the browser dev tools Network tab, then reload `http://localhost:5183` and watch the footer → for the first moments it reads only `Task Notes`, and a `GET /api/version` request is shown as pending.
4. Wait about 5 seconds without touching the page → the footer changes to `Task Notes · version unavailable`, and the `/api/version` request in the Network tab ends as cancelled / failed instead of staying pending.
5. Run `docker compose unpause backend`, then reload `http://localhost:5183` → the footer reads `Task Notes v0.1.0` again within a second.
6. Open `frontend/src/api/version.ts` → `VERSION_REQUEST_TIMEOUT_MS` is declared exactly once, with value `5_000`, and is the value passed to `AbortSignal.timeout` in the fetch.

### Criterion 2: TEST-01 and TEST-03 UAT files name the compose ports
Prerequisites: a checkout of the branch; the stack from Criterion 1 running (unpaused).
1. From the repository root, run `git grep -n -E "5173|8000|localhost:5432" e2e/uat/scenarios/TEST-01_static_landing_page.feature e2e/uat/scenarios/TEST-03_simple_note_form.feature e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` → no output.
2. Run `git grep -n -E "5183|8010|5442" e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` → matches on the prerequisites line (all three ports), setup step 2 (5183), steps 1 and 10 (`http://localhost:5183`) and step 13 (`localhost:5442` in `DATABASE_URL`).
3. Run `git diff origin/main -- e2e/uat/scenarios/TEST-01_static_landing_page.feature e2e/uat/scenarios/TEST-03_simple_note_form.feature e2e/uat/scripts/TEST-01_static_landing_page_uat_script.md e2e/uat/scripts/TEST-03_simple_note_form_uat_script.md` → every changed line differs from its original only in a port number.
4. Follow TEST-01 script step 1 as now written: open `http://localhost:5183` → the "Task Notes" landing page loads without errors.
5. Follow TEST-03 script step 13 as now written (with `DATABASE_URL=postgresql://tasknotes:tasknotes@localhost:5442/tasknotes`) → the backend pytest suite connects to the compose database and passes.
