# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> ## What
>
> The landing page footer shows the short build commit next to the version.
>
> ## Acceptance criteria
>
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (ClickUp task 123k99cwybm.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): the item's 30 comments (2 pages) were read by the dispatching session and none is actionable: all are framework PR-opened notices from earlier runs (recorded in `.claude/artifacts/TEST-10/decisions.md`). → Addressed by: not acted on, because none states a requirement or correction.
- Assumption (ambiguity in criterion 2, recorded instead of a question): TEST-08 and TEST-09 travel in one request, so while it is pending or after it failed there is no version to show either. "The version alone" is read as "no commit part": the footer then keeps TEST-08's decided loading and failure rendering, exactly `Task Notes`, with no `undefined`, `null`, `unknown`, error text, empty parentheses or trailing space. A resolved response whose `commit` is TEST-09's sentinel `unknown` (BUILD_COMMIT unset or blank), empty, whitespace-only, missing or not a string renders the version alone, exactly `Task Notes v{version}`. A response with no usable version keeps TEST-08's `Task Notes` and shows no commit either, because the criterion places the commit next to the version.
- Assumption (format): the commit is rendered as ` ({first 7 characters})` after the version, `Task Notes v0.1.0 (abc1234)`, the format `docs/DEVELOPMENT.md` line 671 already documents for this item.
- Concurrency note (from the dispatch, not a comment): BUG-04 (note form double submit) is planned in parallel. This plan does not modify `LandingPage.tsx` or `NoteForm.tsx`, but must change the `../api/version` mock in `frontend/src/components/LandingPage.test.tsx`, because the client's resolved shape changes. Recorded in shared_risks.md. CHORE-02 (TEST-08 follow-up, fetch timeout) is flagged in `feature_map.md` against `version.ts` and `AppFooter.tsx`.
- Merged since the last plan: n/a (fresh plan, written on the plan base 2df5a7e, current main HEAD, which already holds both dependencies).

## Plan Overview
A frontend-only change on top of TEST-09's endpoint, which on the plan base already returns `{"version": "0.1.0", "commit": "<12 chars or unknown>"}` (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, default `unknown` in `backend/app/core/config.py`). The existing client `frontend/src/api/version.ts` stops ignoring `commit`: `fetchBackendVersion()` now resolves to `{ version, commit }` (commit `null` when unusable) or `null` when the version is unusable, with its throw rules unchanged. `AppFooter` keeps its single mount-time fetch and adds an `app-commit` span showing the first 7 characters in parentheses after the version. No backend change, no route change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): export `type BackendVersion = { version: string; commit: string | null }`. `fetchBackendVersion(): Promise<BackendVersion | null>`. Unchanged: the URL, the throw on a non-OK status (`Loading the version failed: {status} {statusText}`), network rejection propagating, and `null` when `version` is missing, not a string, empty or whitespace after trimming, or `unknown`. New: `commit` is the trimmed `commit` string when it is a string that is non-empty after trimming and not equal to `unknown`, otherwise `null`. Name the sentinel `BACKEND_UNKNOWN_COMMIT = "unknown"` with a comment pointing at `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`. Narrow the parsed body with the existing type guard pattern rather than casting; a non-string `commit` does not make the response invalid, it only yields `commit: null`.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`; the effect is unchanged apart from the type. Add `const SHORT_COMMIT_LENGTH = 7;` with a why-comment (the backend serves 12 characters; the footer shows the conventional short sha). Render `{APP_NAME}`, then when state is non-null `<span data-testid="app-version"> v{state.version}</span>`, then when `state.commit !== null` `<span data-testid="app-commit"> ({state.commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. The footer element, `footerStyle`, `APP_NAME`, the `contentinfo` landmark and the `app-footer` test id stay as they are.
- Routes: none.
- State management: local component state in `AppFooter` (one `BackendVersion | null`). Pending and failure stay `null` and render `Task Notes`, per Re-Plan Feedback.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` on the plan base (TEST-09, merged as 57e1dbd): the BUILD_COMMIT value cut to 12 characters, `unknown` when unset or blank. CORS already allows the frontend origin for GET.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on the backend at `API_BASE_URL` from `frontend/src/api/config.ts`, default `http://localhost:8010`)
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "abcdef123456"}`; `{"version": "0.1.0", "commit": "unknown"}` when BUILD_COMMIT is unset or blank.
- Client result: `{ version: "0.1.0", commit: "abcdef123456" }`; `{ version: "0.1.0", commit: null }` when `commit` is `unknown`, empty, whitespace-only, missing or not a string; `null` when the version is unusable (unchanged from TEST-08); a thrown error on a non-2xx status or a network failure (unchanged).
- Footer text: `Task Notes v0.1.0 (abcdef1)` | `Task Notes v0.1.0` | `Task Notes`.

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice` in `AppFooter.tsx` over any formatting helper or library, because one slice covers it.
- Commit parsing: extends the existing `version.ts` client and its `fetch` call over a new client module or HTTP library, because the commit arrives in the same response the footer already requests.
- E2E commit injection: chose Playwright's built-in `page.route` with `route.fetch()` and `route.fulfill()` (already installed) over restarting the stack with a BUILD_COMMIT value, because the E2E stack runs with BUILD_COMMIT blank and a per-test route is deterministic.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs for criterion 1 (commit injected into the real backend's response) and the criterion 2 edge cases (commit `unknown`, request aborted)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: resolve `{ version, commit }`, with `commit` null for `unknown`, empty, missing or non-string values; export the `BackendVersion` type
- [A] frontend/src/api/version.test.ts: update the resolved-value assertions to the new shape and add the commit cases
- [A] frontend/src/components/AppFooter.tsx: hold `BackendVersion | null` and render the `app-commit` span with the first 7 characters in parentheses
- [A] frontend/src/components/AppFooter.test.tsx: success with commit, success without commit, pending and failure paths against the new resolved shape
- [A] frontend/src/components/LandingPage.test.tsx: the `../api/version` mock resolves `{ version: "9.9.9", commit: null }` instead of a bare string; no other change

No lockfile changes: the plan adds no dependency.
README.md and docs/DEVELOPMENT.md need no edit: this item changes no project structure, run configuration, dependency or test infrastructure, and `docs/DEVELOPMENT.md` line 671 already describes the footer's commit display and its omission rules as planned here.

## Testing Strategy
- Unit tests: the version client (`version.test.ts`, `fetch` stubbed): `{"version":"0.1.0","commit":"abcdef123456"}` resolves to `{ version: "0.1.0", commit: "abcdef123456" }` requested from `http://localhost:8010/api/version`; `commit` of `unknown`, `""`, `"   "`, missing and `1` each resolve with `commit: null`; the existing unusable-version cases still resolve to `null`, the 503 and network-rejection cases still reject, and the `VITE_API_BASE_URL` case still holds. The component (`AppFooter.test.tsx`, `fetchBackendVersion` mocked): success resolving `{ version: "9.9.9", commit: "abcdef123456" }` gives footer `textContent` exactly `Task Notes v9.9.9 (abcdef1)` and `app-commit` text ` (abcdef1)`; success with `commit: null` gives exactly `Task Notes v9.9.9` with no `app-commit`; pending gives exactly `Task Notes`; rejection gives exactly `Task Notes`; none contains `undefined`, `null`, `unknown` or `()`. The landmark test stays.
  - Directory: beside the source under `frontend/src/` (existing convention, run by `npm --prefix frontend test`); `backend/tests/unit/` is not touched.
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`, matching the existing frontend tests
- Integration tests: none new. No router, service or repository changes; TEST-09's `backend/tests/integration/` coverage of `GET /api/version` already asserts the `commit` field the footer consumes.
  - Directory: backend/tests/integration/
- E2E tests: on the real stack, with `page.route("**/api/version", ...)` registered before `page.goto("/")` that calls `route.fetch()` and fulfils with the real body plus `commit: "abcdef123456"`: `app-footer` has exact text `Task Notes v{backendVersion} (abcdef1)` (version from `e2e/helpers/backendVersion.ts`), `app-commit` visible. Edge cases: the same route with `commit: "unknown"` gives exact text `Task Notes v{backendVersion}` and `app-commit` count 0; `route.abort()` gives exact text `Task Notes` and `app-commit` count 0. Locators: `getByTestId`. No fixed waits.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge scenario, without repeating the E2E interaction assertions
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | Verifying it needs no navigation or interaction: it is a render rule over a mocked pending, rejected or commit-less client result, asserted on exact `textContent`. The E2E edge specs repeat the unknown-commit and aborted-request cases once in the browser as the feature's edge spec. |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | route `**/api/version` through `route.fetch()` and fulfil with `commit: "abcdef123456"`; `goto("/")`; `app-footer` has text `Task Notes v{backendVersion} (abcdef1)` | Given the backend was started with BUILD_COMMIT abcdef1234567890abcdef1234567890abcdef12, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (abcdef1)" |
| 2 | Pending or failed shows no commit and no error | covered at Unit, see Criterion coverage; edge specs fulfil `commit: "unknown"` and abort the request | Given the backend has no build commit, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with nothing after it |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: from the repository root, start the stack with a known commit: `BUILD_COMMIT=abcdef1234567890abcdef1234567890abcdef12 docker compose up -d --build` (frontend http://localhost:5183, backend http://localhost:8010). `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open http://localhost:8010/api/version in a browser tab → the JSON reads `{"version":"0.1.0","commit":"abcdef123456"}`.
2. Open http://localhost:5183/ → the footer at the bottom of the landing page reads exactly `Task Notes v0.1.0 (abcdef1)`: seven characters inside the parentheses, right after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack from Criterion 1 is running, in Chrome.
1. From the repository root run `BUILD_COMMIT= docker compose up -d backend` → the backend container is recreated; http://localhost:8010/api/version now reads `"commit":"unknown"`.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown` and no trailing space.
3. Open DevTools → Network, set throttling to "Slow 3G" and reload while watching the footer → before the version request completes the footer reads exactly `Task Notes`, with no `undefined` and no error text; once it completes it reads `Task Notes v0.1.0`. Set throttling back to "No throttling".
4. Run `docker compose stop backend`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no `undefined`, `null`, error text or empty parentheses.
5. Run `docker compose start backend` → once http://localhost:8010/api/version answers again, reloading the page shows `Task Notes v0.1.0`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test` from the repository root → the run includes `src/components/AppFooter.test.tsx` (success with commit, success without commit, pending and failure tests) and `src/api/version.test.ts`, and reports 0 failed.
