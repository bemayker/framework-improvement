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

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): all ~45 comments on the ClickUp task are mayker-dev's own "PR opened" notes from earlier runs → not acted on because none carries stakeholder feedback on scope or behaviour (summarised by the dispatching session; no comment changes this plan).
- Assumption (criterion 2, "the version alone"): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. TEST-08 already fixed that state to read exactly `Task Notes`. This plan reads "the version alone" as "the footer without any commit segment": pending and failure keep TEST-08's exact `Task Notes` text, and when the request succeeds but the commit is unusable (missing, not a string, empty, or the backend's `unknown` default from TEST-09) the footer shows the version alone, `Task Notes v{version}`. In every case no `undefined`, `null`, `unknown` or error text is rendered.
- Assumption (criterion 1, "next to the version"): the commit renders directly after the version span as ` ({7 chars})`, e.g. `Task Notes v0.1.0 (abc1234)`, in its own `<span data-testid="app-commit">`, inheriting the footer's existing style. The parentheses are a presentation choice (Design Reference mode NONE).
- Assumption (shortening): TEST-09 already cuts the commit to 12 characters server-side; the frontend takes the first 7 of whatever it receives (`slice(0, 7)`), so a commit shorter than 7 characters is shown as received.
- Merged since the last plan: n/a (fresh plan, branched from current main f875d1d3).

## Plan Overview
Frontend only. The existing version client `frontend/src/api/version.ts` (TEST-08) keeps its single `GET /api/version` call but returns the build commit alongside the version: `fetchBackendVersion()` changes from `Promise<string | null>` to `Promise<BackendVersion | null>`, where `BackendVersion = { version: string; commit: string | null }` and `commit` is already shortened to 7 characters or `null` when unusable. `AppFooter.tsx` stores that object and renders a second span for the commit when present. No backend change: TEST-09's endpoint already returns `commit`. `LandingPage.tsx` is not modified; only its test's mock of `fetchBackendVersion` changes shape.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: extend `VersionResponse` with `commit: string`; add exported type `BackendVersion = { version: string; commit: string | null }`; `fetchBackendVersion()` resolves `{ version, commit }` on success. Version rules unchanged (null on network error, non-OK, missing/empty/non-string version, or `unknown`). Commit rule: `commit` is a non-empty string other than `unknown` → `commit.slice(0, SHORT_COMMIT_LENGTH)` with `SHORT_COMMIT_LENGTH = 7`; otherwise `null` (the version is still returned).
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null`; render `{APP_NAME}`, then when resolved `<span data-testid="app-version"> v{version}</span>`, then when `commit !== null` `<span data-testid="app-commit"> ({commit})</span>`. Pending and failure render exactly `Task Notes`, as today.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span adds no style of its own; it inherits the footer's existing `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05/TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "abc1234def56"}` — `commit` is the first 12 characters of `BUILD_COMMIT`, default `"unknown"`.
- Frontend client contract: `fetchBackendVersion(): Promise<BackendVersion | null>`; for the body above it resolves `{ version: "0.1.0", commit: "abc1234" }`; for `{"version": "0.1.0", "commit": "unknown"}` it resolves `{ version: "0.1.0", commit: null }`; on any failure it resolves `null`.

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` (standard library) over any helper or dependency, because it is the whole need.
- No net-new component, module or dependency: the commit is a second field read by the existing client and a second span in the existing footer.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 (stubbed `/api/version` body, footer shows the 7-char commit next to the version) and the edge case (aborted request, footer reads `Task Notes` with no `app-commit`)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `BackendVersion` (`version` plus 7-char `commit` or `null`) instead of a bare version string
- [A] frontend/src/api/version.test.ts: client tests for the commit field (shortened, `unknown`, missing, empty, non-string) and the existing version/failure cases against the new return shape
- [A] frontend/src/components/AppFooter.tsx: render the `app-commit` span after the version when a commit is present
- [A] frontend/src/components/AppFooter.test.tsx: component tests for the success (version and commit), version-without-commit, pending and failure paths
- [A] frontend/src/components/LandingPage.test.tsx: update the `fetchBackendVersion` mock to resolve the new `{ version, commit }` shape (LandingPage.tsx itself is unchanged)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the exact-text footer assertion `Task Notes v{version}` becomes a contains/starts-with assertion, so it holds when the environment sets `BUILD_COMMIT` and a commit follows the version

No dependency is added or changed, so no lockfile changes. README.md and docs/DEVELOPMENT.md need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest, co-located. `version.test.ts` for the client's commit normalisation; `AppFooter.test.tsx` component tests for success, pending and failure (criterion 3).
  - Directory: `frontend/src/` (co-located, per project standards; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Name}.test.ts(x)`
- Integration tests: not warranted — no repository, model, migration or endpoint changes (TEST-09's integration tests already cover the `commit` field of `GET /api/version`).
  - Directory: backend/tests/integration/ (no new file)
- E2E tests: criterion 1 only, plus the feature's edge-case spec (aborted request). `/api/version` is fulfilled via `page.route` with `{"version": "0.1.0", "commit": "abc1234def56"}` so the expected text is deterministic whatever `BUILD_COMMIT` the environment sets.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the aborted-request edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `footer shows the first 7 characters of the build commit next to the version`, `returns the version and the commit cut to 7 characters` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders no commit while the version request is pending`, `renders no commit when the version request fails`, `renders the version alone when the backend reports no usable commit`, `returns a null commit when the backend reports the unknown sentinel` | verifying it needs no navigation or interaction: it is the footer's render for a given fetch outcome, which a component test controls exactly (a pending promise cannot be held open reliably in a browser) |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the version and the short commit once the fetch resolves`, `renders no commit while the version request is pending`, `renders no commit when the version request fails` | the criterion is the existence of component tests; it is verified by those tests passing |

Edge-case E2E spec (Section 4 floor, not a criterion row): `footer shows no commit when the version endpoint is unreachable`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | Fulfil `/api/version` with `{"version": "0.1.0", "commit": "abc1234def56"}`, open `/`, assert `app-commit` has text ` (abc1234)` and `app-footer` has text `Task Notes v0.1.0 (abc1234)` | Given the backend reports version 0.1.0 and commit abc1234def56, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (abc1234)" |
| 2 | Pending or failed request shows no commit, never `undefined` or an error | covered at Unit, see Criterion coverage; the aborted-request edge-case spec also asserts `Task Notes` alone | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" and shows no commit, "undefined" or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack is running with the backend started with `BUILD_COMMIT=abc1234def5678` in its environment (for example in `.env` or the compose service's environment), and the frontend is served at http://localhost:5183.
1. In a terminal, run `curl -s http://localhost:8010/api/version` (or the backend port your stack uses) → the body shows `"commit":"abc1234def56"` and a `"version"` value, e.g. `0.1.0`.
2. Open http://localhost:5183/ in a browser → the landing page titled "Task Notes" loads.
3. Read the footer at the bottom of the page → it reads `Task Notes v0.1.0 (abc1234)`: the version from step 1, then the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. Open http://localhost:5183/ with the browser DevTools Network tab open, and in DevTools block the request URL `*/api/version` (right-click the request → Block request URL), then reload → the footer reads exactly `Task Notes`, with no version, no commit, no `undefined` and no error text.
2. Unblock the URL, stop the backend, and reload the page → the footer again reads exactly `Task Notes`.
3. Restart the backend without `BUILD_COMMIT` set (so `/api/version` returns `"commit":"unknown"`) and reload the page → the footer reads `Task Notes v0.1.0` (the version alone), with no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the test titles in the output → they include `renders the version and the short commit once the fetch resolves`, `renders no commit while the version request is pending` and `renders no commit when the version request fails`.
