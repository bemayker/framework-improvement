# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria:
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable. The item carries only earlier runs' bot PR notices, which say nothing about scope → not acted on because they are status notices, not feedback.
- Assumption (criterion 2, "the version alone"): `GET /api/version` is ONE request that carries both `version` and `commit`, so while it is pending there is no version yet either. The footer therefore keeps TEST-08's behaviour exactly: pending or a failed request shows `Task Notes` (no version, no commit); a successful request whose commit is unusable (the backend's `unknown` sentinel, missing, empty or not a string) shows `Task Notes v{version}` with no commit. In no state does the footer render `undefined`, `null`, `unknown` or an error text.
- Assumption (format): the commit renders after the version in parentheses, `Task Notes v0.1.0 (abc1234)`, in its own span `data-testid="app-footer-commit"`. Design Reference is NONE, so the format is freestyle.
- Plan base: main @ 0ad05fa (TEST-08's runtime footer and TEST-09's `commit` field both merged). No previous plan exists, so no merged-since check applies (fresh plan, branched from current main).

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) is extended to read the `commit` field TEST-09 added to `GET /api/version` and to return `{ version, commit }`, where `commit` is the first 7 characters of the backend's commit or `null` when the backend has no usable commit. `AppFooter.tsx` renders the short commit next to the version when present. The commit is optional for the footer: a bad or missing commit never hides a good version. No backend, no route, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `getBackendVersion()` keeps its name and its rejection rules for the version (network error, non-OK status, malformed body, `version` sentinel `unknown`), and now resolves to `BackendVersion = { version: string; commit: string | null }`. New constants `BACKEND_UNKNOWN_COMMIT = "unknown"` (mirrors `UNKNOWN_BUILD_COMMIT` in `backend/app/core/config.py`) and `SHORT_COMMIT_LENGTH = 7`. Commit rule: when `body.commit` is a string that, trimmed, is non-empty and not `unknown`, return its first 7 characters; otherwise `null`. A missing or malformed `commit` does NOT reject, because the version is still usable.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null` (null = pending or failed, as today). Render `{APP_NAME}`, then `<span data-testid="app-footer-version"> v{version}</span>` when resolved (unchanged), then `<span data-testid="app-footer-commit"> ({commit})</span>` only when `commit !== null`.
  - `frontend/src/components/LandingPage.tsx`: NOT modified.
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (one fetch on mount, `isMounted` guard).
- Design reference notes: AI freestyle. The commit span inherits the footer's existing style (0.875rem, #5f5f5f); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`. `commit` is at most 12 characters (backend `BUILD_COMMIT_LENGTH`), or `"unknown"` when `BUILD_COMMIT` is unset or blank.
- Client result (frontend-internal): `{ version: "0.1.0", commit: "0123456" }`, or `{ version: "0.1.0", commit: null }` when the commit is `unknown`, missing, empty or not a string.

## Technology Selection
- Short-commit derivation: chose `String.prototype.trim` and `slice(0, 7)` (standard library) over any formatting helper or dependency; nothing more is needed.
- Commit span in the footer: no net-new component; the existing `AppFooter` gains one conditional `<span>`, chosen over a new `BuildCommit` component because a separate component for one span is a hasty abstraction.
- No net-new dependency: the existing `fetch`, React state and Vitest with Testing Library cover the feature and its tests.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec, `/api/version` fulfilled via `page.route` with a known commit (footer reads `Task Notes v{version} ({first 7})`) and with `commit: "unknown"` (footer reads `Task Notes v{version}`, no `app-footer-commit`)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `BackendVersion` type, commit sentinel and length constants, `getBackendVersion()` resolves `{ version, commit }`
- [A] frontend/src/api/version.test.ts: existing success assertions move to `{ version, commit }`; new cases for 12-char commit truncated to 7, `unknown` commit gives `null`, missing commit gives `null`, non-string or empty commit gives `null`, version still rejected as before
- [A] frontend/src/components/AppFooter.tsx: render the short commit span next to the version when present
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve `{ version, commit }`; success path with commit (`Task Notes v9.9.9 (abc1234)`), success without commit (`Task Notes v9.9.9`, no `app-footer-commit`), pending path and failure path (`Task Notes`, no version or commit span, no `undefined`)
- [A] frontend/src/components/LandingPage.test.tsx: the version mock's resolved value only (line 33) becomes `{ version: "9.9.9", commit: null }`, required because the client's return type changes; no other line in the file changes
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the success test's exact `toHaveText` derives the expected text from the observed response, appending ` ({first 7 of commit})` when the commit is not `unknown`, so the spec stays true in an environment where `BUILD_COMMIT` is set
- [Docs] docs/DEVELOPMENT.md: the footer paragraph (currently "The response's `commit` field is not shown in the footer.") now says the footer shows the first 7 characters of `commit` after the version, and omits it when the commit is `unknown`, missing or the request is pending or failed

No lockfile changes: the feature adds or changes no dependency. README.md needs no edit: project structure, run configuration and test infrastructure are unchanged.

## Testing Strategy
- Unit tests: Vitest with Testing Library, frontend only (no backend code changes, so no pytest unit tests).
  - `frontend/src/api/version.test.ts`: client parse and truncation rules.
  - `frontend/src/components/AppFooter.test.tsx`: success with commit, success without commit, pending, failure (criterion 3's component test).
  - Directory: co-located `frontend/src/**` `*.test.ts(x)`, the existing frontend convention (CLAUDE.md's unit directory `backend/tests/unit/` is the backend's).
  - Naming: `{Module}.test.ts(x)`, as existing.
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`GET /api/version` is TEST-09's and already covered by its integration tests).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one new spec, two tests: known commit rendered as 7 characters next to the version, and the `unknown` commit edge case. Both fulfil `/api/version` with `page.route` so the result does not depend on the environment's `BUILD_COMMIT`. TEST-08's spec is adjusted as listed in the manifest.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the `unknown`-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — (also unit: the 7-character truncation in `version.test.ts` and the rendered span in `AppFooter.test.tsx`) |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending and failure are component states driven by the mocked client, and a deterministic pending state cannot be held open reliably in a browser; the unreachable-endpoint browser case is already covered by TEST-08's spec, and TEST-10's E2E edge test covers the `unknown` commit |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test: it is satisfied by `AppFooter.test.tsx` existing and passing, which no browser can show |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | `page.route("**/api/version")` fulfils `{"version": "1.2.3", "commit": "0123456789ab"}`; `goto("/")`; `app-footer` has text `Task Notes v1.2.3 (0123456)` and `app-footer-commit` is visible | Given the backend reports commit 0123456789ab, When I open the landing page, Then the footer reads "Task Notes v{version} (0123456)" |
| 2 | Pending or failure shows the version alone, never `undefined` or an error | covered at Unit, see Criterion coverage; E2E edge test: commit `unknown` gives `Task Notes v1.2.3` with `app-footer-commit` count 0 and no `undefined`/`null`/`unknown` text | Given the backend has no build commit, When I open the landing page, Then the footer shows the version with no commit and no "unknown" |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend tests, When I run `AppFooter.test.tsx`, Then success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the stack started from the repository root with a known commit, `BUILD_COMMIT=0123456789abcdef0123 docker compose up -d --build`; frontend reachable at http://localhost:5183.
1. Run `curl -s http://localhost:8010/api/version` (or the backend port your compose file publishes) → the JSON shows `"commit":"0123456789ab"` and a `version`, for example `"version":"0.1.0"`; note that version.
2. Open http://localhost:5183/ in a browser → the landing page with the "Task Notes" heading loads.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0 (0123456)`: the version from step 1, then exactly the first 7 characters `0123456` in parentheses.

### Criterion 2: While pending or on failure, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack started WITHOUT a commit, `docker compose up -d --build` with `BUILD_COMMIT` unset in your shell.
1. Run `curl -s http://localhost:8010/api/version` → the JSON shows `"commit":"unknown"`.
2. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0` (the version from step 1), with no parentheses and no `unknown`, `undefined` or `null`.
3. Open the browser DevTools Network tab, set request blocking for `*/api/version`, and reload http://localhost:5183/ → the footer reads `Task Notes` only, with no error text and no `undefined`.
4. Remove the block, set DevTools throttling to "Slow 3G" and reload → while `/api/version` is still loading the footer reads `Task Notes`; when it completes it reads `Task Notes v0.1.0`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a success test asserting `Task Notes v9.9.9 (abc1234)`, a pending test (never-settling promise) asserting `Task Notes` with no commit span, and a failure test (rejected promise) asserting `Task Notes` with no version or commit span.
