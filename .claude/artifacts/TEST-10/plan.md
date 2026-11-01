# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09. (ClickUp task 123k99cwybm, https://app.clickup.com/t/123k99cwybm)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 18 comments read, all framework notes (status and run bookkeeping), none actionable → Addressed by: not acted on, because none states a requirement or corrects the description. Per the dispatch, none carries feedback on the feature itself.
- Assumption (recorded instead of a blocking question, per `user_story_alignment.md` Section 4): the version and the commit arrive in **one** response from `GET /api/version`, so there is no state where the request is pending or has failed and the version is nevertheless known. Criterion 2's "the footer shows the version alone" is read as: **whenever no usable commit is available, the footer renders exactly what TEST-08 renders for that state, with no commit part**. Concretely: while the request is pending, `Task Notes` (TEST-08's loading state, the version is not yet known either); when the request fails (network error, non-2xx), `Task Notes` (TEST-08's failure state); when the response arrives with a version but the commit is missing, empty, non-string or the backend sentinel `unknown`, `Task Notes v{version}`. It never shows `undefined`, `null`, `unknown`, an error text, or an empty `()`. Adding a second request or a cached version to make "version alone" literally true while pending would be gold plating and is not planned.
- Assumption: the commit is shown as ` ({7 chars})` directly after the version, e.g. `Task Notes v0.1.0 (0123456)`. "Next to the version" fixes the position, not the separator; parentheses keep it readable as a qualifier of the version. Design Reference mode is NONE, so this is the freestyle choice, recorded here.
- Assumption: the backend's `UNKNOWN_BUILD_COMMIT = "unknown"` (`backend/app/core/config.py`) is treated as "no commit", by the same rule TEST-08 applies to `UNKNOWN_VERSION`. The cut to 7 characters happens after the sentinel check, so `unknown` is never shown as `unknown` cut short. A commit shorter than 7 characters is shown as it is.
- Merged since the last plan: n/a (fresh plan, branched from current main 0a8ff26; no `[merged-since]` lines in the dispatch).
- Shared-risk note from `feature_map.md` (BUG-04 on `LandingPage.tsx`, CHORE-02 on `version.ts` and `AppFooter.tsx`) → `LandingPage.tsx` is not modified by this plan; BUG-04 is complete and CHORE-02 cancelled, so neither is a live conflict.

## Plan Overview
Frontend only. TEST-09 already made `GET /api/version` return `{"version": "...", "commit": "<12 chars or unknown>"}`; TEST-08 already made the footer fetch it through `frontend/src/api/version.ts` and show `Task Notes v{version}`. This item widens the client's result from the version string to `{ version, commit }`, with the commit normalised to its first 7 characters or `null`, and renders the commit in its own span after the version span. No backend change: the endpoint already returns the commit. Tests: client unit tests extended for the commit, the footer component tests reworked around the new result shape with success, pending and failure paths, the landing page test's mock updated to the new shape, one new E2E spec, and TEST-08's real-backend E2E assertion relaxed so a backend started with `BUILD_COMMIT` set does not break it.

## Frontend Plan
- Components to create/modify:
  `frontend/src/api/version.ts` (modify): keep the function name `fetchBackendVersion` (so existing mocks keep their module shape) and change its result to `Promise<BackendVersion | null>`, where `export type BackendVersion = { version: string; commit: string | null }`. Extend `VersionResponse` to `{ version: string; commit: string }`. The version rule is unchanged: missing, empty, non-string or `unknown` resolves the whole result to `null`. The commit rule is new: take `body.commit` when it is a string, trim it, return `null` when it is empty or equals `UNKNOWN_BUILD_COMMIT = "unknown"` (named once, with a comment pointing at `backend/app/core/config.py`), otherwise `commit.slice(0, SHORT_COMMIT_LENGTH)` with `SHORT_COMMIT_LENGTH = 7`. Non-2xx and network errors still reject exactly as today.
  `frontend/src/components/AppFooter.tsx` (modify): hold `backendVersion: BackendVersion | null` instead of `string | null`; loading, rejection and `null` paths unchanged. Render `Task Notes`, then, when `backendVersion !== null`, `<span data-testid="app-footer-version"> v{backendVersion.version}</span>`, then, when `backendVersion?.commit` is non-null, `<span data-testid="app-footer-commit"> ({backendVersion.commit})</span>`. The leading space lives inside each span, so an absent part leaves no gap. `footerStyle`, `data-testid="app-footer"` and the `contentinfo` landmark are unchanged.
  `frontend/src/components/LandingPage.tsx`: **not modified** (it renders `<AppFooter />`, which owns its fetch).
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`, as today.
- States: pending `Task Notes`; failure `Task Notes`; version without usable commit `Task Notes v0.1.0`; success `Task Notes v0.1.0 (0123456)`.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer styling unchanged from TEST-04 and TEST-08: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the commit span inherits it and adds no style.

## Backend Plan
No backend changes required. `GET /api/version` (`backend/app/routers/version.py`) already returns `commit` from `get_build_commit()` in `backend/app/services/version_service.py`, cut to 12 characters, with `unknown` when `BUILD_COMMIT` is unset or blank (`backend/app/core/config.py`). Its tests stay as they are.

## API Integration Plan
No external API integration. (The footer consumes this project's own backend through the existing client `frontend/src/api/version.ts`.)

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL` from `frontend/src/api/config.ts`, default `http://localhost:8010`, overridable through `VITE_API_BASE_URL`)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0", "commit": "0123456789ab"}` (backend `VersionResponse`). `"commit": "unknown"` is the backend's sentinel for an unset `BUILD_COMMIT` and is treated as "no commit". Client result: `{ version: "0.1.0", commit: "0123456" }`, or `{ version: "0.1.0", commit: null }`, or `null` when the version itself is unusable; rejects on network error or non-2xx.

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` (standard library) over any helper or dependency; nothing else is needed.
- Commit display: chose a second plain `<span>` in the existing footer over a new component, because it is one conditional text node.
- No net-new module and no new dependency, so no lockfile changes.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs for the footer showing the 7-character commit next to the version, and the edge case of an `unknown` commit showing the version alone
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the `unknown` commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [A] frontend/src/api/version.ts: result widened to `BackendVersion | null` with `commit` normalised to 7 characters or `null`; `VersionResponse` gains `commit`
- [A] frontend/src/api/version.test.ts: existing cases assert the new result shape; new cases for a 12-character commit cut to 7, the `unknown` commit sentinel, an empty, missing and non-string commit, a commit shorter than 7
- [A] frontend/src/components/AppFooter.tsx: render the commit span after the version span when a commit resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock resolves `BackendVersion`; success (`Task Notes v0.1.0 (0123456)`), pending, rejected, `null`, version with `commit: null`; existing divergence and landmark cases kept
- [A] frontend/src/components/LandingPage.test.tsx: version mock resolves `{ version: "7.7.7", commit: null }` instead of the bare string, footer assertion unchanged
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the real-backend spec asserts the version span and that the footer text starts with `Task Notes v{version}`, so a backend started with `BUILD_COMMIT` set does not fail it; the stubbed specs are unchanged
- [Docs] docs/DEVELOPMENT.md: the "The page footer shows the backend's version" paragraph says the footer shows the version only; update it to describe the 7-character commit and the states in `## Frontend Plan`

No dependency is added or changed, so no lockfile is regenerated. `README.md` does not describe the footer and needs no edit. `frontend/src/components/LandingPage.tsx` and every backend file are deliberately absent: see `## Frontend Plan` and `## Backend Plan`. `e2e/tests/TEST-04_page_footer.spec.ts` uses `toContainText(version)` and passes with a commit present, so it is not modified.

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (client, `fetch` stubbed with `vi.stubGlobal` as today) and `frontend/src/components/AppFooter.test.tsx` (component, `../api/version` mocked with `vi.mock`, pending via a never-resolving promise, assertions via `findByTestId` and `waitFor`, no fixed waits). `frontend/src/components/LandingPage.test.tsx` keeps passing with the new mock shape. No backend tests: no backend code changes.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (Vitest, the frontend's existing convention; `backend/tests/unit/` in CLAUDE.md is the backend's)
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`, as the existing frontend tests
- Integration tests: no new ones. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py`, which must stay green.
  - Directory: `backend/tests/integration/`
- E2E tests: `e2e/tests/TEST-10_footer_build_commit.spec.ts` with two specs, both stubbing the backend call with `page.route` matched on `new URL(url).pathname === "/api/version"` (never a substring: Vite serves `src/api/version.ts` from a URL containing it, as TEST-08's spec documents) and fulfilling with `access-control-allow-origin: *`: (1) body `{"version": "0.1.0", "commit": "0123456789ab"}` → footer text exactly `Task Notes v0.1.0 (0123456)` and `app-footer-commit` reads `(0123456)`; (2) edge case, body `{"version": "0.1.0", "commit": "unknown"}` → footer text exactly `Task Notes v0.1.0`, `app-footer-commit` count 0, no `unknown`, `undefined` or `null`. Stubbing is required because the CI and local stacks run with `BUILD_COMMIT` unset, so the real backend reports `unknown`.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the `unknown` commit edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is a render rule over the client's result, covered in `AppFooter.test.tsx` for pending, rejection, `null` and `commit: null`, and in `version.test.ts` for the sentinel and malformed commits (the E2E edge-case spec repeats the `unknown` commit case in the browser) |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test in `AppFooter.test.tsx`; a browser cannot cover it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Stub `/api/version` with commit `0123456789ab`, open `/`, expect footer text `Task Notes v0.1.0 (0123456)` | Given the backend reports version 0.1.0 and commit 0123456789ab, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed: version alone, never `undefined` or an error | covered at Unit, see Criterion coverage; the E2E edge-case spec stubs commit `unknown` and expects `Task Notes v0.1.0` | Given the backend reports no build commit, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no commit, "unknown", "undefined" or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend tests, When I run `npm --prefix frontend test`, Then the AppFooter success, pending and failure tests report 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repo root, start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (backend on port 8010, frontend on port 5183); `backend/pyproject.toml` reads `version = "0.1.0"`.
1. In a terminal run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` in a browser and scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0 (0123456)`: seven characters of the commit, in parentheses, directly after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. Recreate the backend without a commit: `docker compose up -d --force-recreate backend` (with `BUILD_COMMIT` not set in the shell), then run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0","commit":"unknown"}`.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and none of the words `unknown`, `undefined`, `null` or `error`.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes` (the request failed, so neither version nor commit is known; this is TEST-08's failure state, recorded in `## Re-Plan Feedback`), with no error text.
4. The pending state lasts only until the request answers and is not reliably observable by hand; the observable check is criterion 3's component test for the pending path (footer text exactly `Task Notes`).
5. Run `docker compose start backend` and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repo root run `npm --prefix frontend test` → Vitest runs `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` among the suite, and the summary reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it holds a success test expecting `Task Notes v0.1.0 (0123456)`, a pending test (never-resolving client) expecting exactly `Task Notes`, and failure tests (rejected client, `null` result) expecting exactly `Task Notes`, plus a test where the commit is `null` expecting exactly `Task Notes v0.1.0`.
