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
- [ ] AC1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] AC2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] AC3: A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable. The ClickUp task (123k99cwybm) carries only automated PR notices from earlier runs → Addressed by: nothing to act on; recorded so the count is checkable.
- Merged since the last plan: n/a (fresh plan, planned against current main 9a49388; TEST-08 PR #330 and TEST-09 PR #328 are both on main and were read from it).
- Assumption (AC2, "the version alone"): `GET /api/version` is one request that carries both `version` and `commit`, so there is no state in which the version is known and the commit request is still pending. AC2 is read as: whenever no usable commit is available the footer omits the commit and shows exactly what TEST-08 shows. Concretely: request pending or failed (network error, non-2xx, malformed body, unusable version) → `Task Notes` (TEST-08's existing name-only rendering, unchanged, since there is no version to show either); version usable but `commit` missing, non-string, blank, or the backend's `"unknown"` sentinel (`UNKNOWN_COMMIT` in `backend/app/services/version_service.py`) → `Task Notes v{version}`. In no state does the text contain `undefined`, `null`, `unknown` or an error message.
- Assumption (AC1, "next to the version"): the display format is `Task Notes v{version} ({first 7 chars of commit})`, e.g. `Task Notes v0.1.0 (9a6bfd7)`. This is the format `docs/DEVELOPMENT.md` line 665 already documents (that paragraph survived the sandbox reset 9dcba19, which reverted the code of an earlier TEST-10 run but not that doc line), so the docs need no edit.
- Note (sandbox history): an earlier TEST-10 implementation (f783902, PR #324) is an ancestor of main but its code was reverted by the reset 9dcba19; current main's `AppFooter.tsx` and `api/version.ts` carry no commit handling. This plan builds against main as it now stands, not against f783902.

## Plan Overview
Frontend-only change. The existing version API client (`frontend/src/api/version.ts`) is extended to also return the `commit` field TEST-09 added to `GET /api/version`, normalised to `string | null` (null for missing, non-string, blank or the `"unknown"` sentinel). `AppFooter` renders `Task Notes v{version} ({commit.slice(0, 7)})` when both are usable, `Task Notes v{version}` when only the version is, and `Task Notes` while pending or on failure (TEST-08 behaviour unchanged). Component tests (Vitest + Testing Library) cover success, pending and failure; client unit tests cover the commit normalisation; one Playwright spec covers the landing page rendering with a fulfilled `/api/version` route. No backend, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: change `fetchAppVersion()`'s resolved value from `string | null` to `AppVersion | null`, where `export type AppVersion = { version: string; commit: string | null }`. `VersionResponse` gains `commit: string`. The version rules are unchanged (null result for network error, non-2xx, malformed JSON, missing/non-string/empty/`"unknown"` version). The commit is read independently: a non-string, trimmed-empty or `"unknown"` (new `UNRESOLVED_COMMIT` constant, documented as mirroring `UNKNOWN_COMMIT` in `backend/app/services/version_service.py`) commit yields `commit: null` while the version is still returned. The client returns the commit as the backend reported it (up to 12 characters); it does not shorten it. Still never throws.
  - `frontend/src/components/AppFooter.tsx`: state becomes `AppVersion | null`. Add `const SHORT_COMMIT_LENGTH = 7;` and a small pure render helper inside the module that builds the text: `null` → `Task Notes`; commit null → `Task Notes v{version}`; otherwise `Task Notes v{version} ({commit.slice(0, SHORT_COMMIT_LENGTH)})`. The 7-character cut is presentation, so it lives in the component, not the client. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark), the mount guard and the existing style object unchanged.
- Routes: none (the footer is already rendered by `frontend/src/components/LandingPage.tsx`, which is not modified).
- State management: local `useState` in `AppFooter`, unchanged pattern.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit is plain text in the existing footer line, inheriting TEST-08's footer style (`fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`); no new styling.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": str, "commit": str}` (TEST-09, `backend/app/schemas/version.py`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, unchanged)
- Request: none
- Response (200): `{"version": "0.1.0", "commit": "9a6bfd7c3e1f"}`. `commit` is at most 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset or blank.
- Frontend client contract: `fetchAppVersion(): Promise<AppVersion | null>`; `AppVersion = { version: string; commit: string | null }`.

## Technology Selection
- Commit normalisation in the client: chose a few lines of plain TypeScript (`typeof`, `trim`, comparison against a constant) over a schema-validation library; the project installs none and the check is three conditions.
- Commit shortening: chose `String.prototype.slice(0, 7)` from the standard library; no alternative needed.
- No net-new component, module or dependency is introduced: both changed modules already exist, and tests reuse the installed Vitest, Testing Library and Playwright.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec; landing page footer shows `Task Notes v{version} (9a6bfd7)` when `/api/version` is fulfilled with a 12-char commit, and the version alone when the commit is `"unknown"` (edge case)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: return `AppVersion | null` with a normalised `commit`; add `AppVersion` type and `UNRESOLVED_COMMIT` constant
- [A] frontend/src/api/version.test.ts: update existing cases to the new return shape; add commit cases (present, missing, non-string, blank, `"unknown"` each yield `commit: null` with the version kept; a version failure still yields null regardless of commit)
- [A] frontend/src/components/AppFooter.tsx: render the short commit after the version; name-only and version-only states as described in Frontend Plan
- [A] frontend/src/components/AppFooter.test.tsx: success (12-char commit renders first 7 in parentheses), version-only (commit null), pending (never-resolving promise renders `Task Notes`), failure (null renders `Task Notes`, no `undefined`/`null`/`unknown`); keep the landmark test
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the first test's exact `toHaveText("Task Notes v{version}")` becomes a match that also accepts an optional ` ({7 hex chars})` suffix, because the footer now legitimately carries the commit whenever the stack runs with `BUILD_COMMIT` set; its failure-path test is unchanged

No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes, and `docs/DEVELOPMENT.md` line 665 already documents this footer format.

## Testing Strategy
- Unit tests: Vitest + Testing Library, co-located with the frontend source as the existing tests are (`frontend/src/api/version.test.ts`, `frontend/src/components/AppFooter.test.tsx`). Client: commit normalisation and unchanged version rules. Component: success, version-only, pending and failure renderings (AC3 names the component test explicitly).
  - Directory: `frontend/src/` co-located (the existing frontend convention; `backend/tests/unit/` in CLAUDE.md is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing files
- Integration tests: not warranted. Enabled per CLAUDE.md, but this feature adds or modifies no repository, model, migration or endpoint (`testing_standards.md` Section 6).
- E2E tests: one spec, landing page footer rendered in the browser with `page.route("**/api/version", ...)` fulfilling a deterministic body (CI's compose stack runs with `BUILD_COMMIT` unset, so the real backend reports `"unknown"`; fulfilling the route is what makes the commit deterministic). Happy path plus the `"unknown"` edge case. TEST-08's spec is adjusted as listed in the manifest.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one scenario per criterion plus an edge case (`commit` is `"unknown"`).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is a rendering branch on the client's resolved value, exercised by the component test with a never-resolving and a null-resolving mock (the request-failure path in the browser is already covered by TEST-08's spec) |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component (Vitest) test requirement, so the component test is the coverage |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 chars of the commit next to the version | Fulfil `**/api/version` with `{"version":"0.1.0","commit":"9a6bfd7c3e1f"}`, `page.goto("/")`, expect `getByTestId("app-footer")` to have text `Task Notes v0.1.0 (9a6bfd7)`; edge: commit `"unknown"` → `Task Notes v0.1.0` | Given the backend reports commit 9a6bfd7c3e1f When I open the landing page Then the footer reads "Task Notes v0.1.0 (9a6bfd7)" |
| 2 | Pending or failed request shows the version alone, never `undefined` or an error | covered at Unit, see Criterion coverage | Given the backend is unreachable When I open the landing page Then the footer reads "Task Notes" with no "undefined" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter component tests Then they report 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: Docker running; repository on `feature/TEST-10-footer-build-commit` (or `main` once merged); host ports 5183 and 8010 free; `BUILD_COMMIT` not set in `.env`.
1. In a terminal at the repository root, run `BUILD_COMMIT=9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b docker compose up -d --build` → the `backend`, `frontend` and `db` services start.
2. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"9a6bfd7c3e1f"}`.
3. Open http://localhost:5183 in a browser and scroll to the bottom of the landing page → the footer reads exactly `Task Notes v0.1.0 (9a6bfd7)`.
4. Run `docker compose up -d --force-recreate backend` with `BUILD_COMMIT` unset in the shell, then reload http://localhost:5183 → the footer reads exactly `Task Notes v0.1.0`, with no `unknown` and no empty parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 running.
1. Run `docker compose stop backend`, then reload http://localhost:5183 → the footer reads exactly `Task Notes`; it contains no `undefined`, `null`, `unknown` or error text, and the rest of the page renders.
2. Run `docker compose start backend`, open the browser DevTools Network tab, set throttling to `Slow 3G`, and reload http://localhost:5183 → while the `version` request is still listed as pending the footer reads `Task Notes`; once it completes the footer reads `Task Notes v0.1.0` (or `Task Notes v0.1.0 (9a6bfd7)` if the backend runs with the `BUILD_COMMIT` from Criterion 1 step 1).
3. Set throttling back to `No throttling`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: Node installed and `npm --prefix frontend install` run once.
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run ends with `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a success test (commit shown as its first 7 characters in parentheses), a pending test (never-resolving promise, footer reads `Task Notes`) and a failure test (null result, footer reads `Task Notes` and contains no `undefined`, `null` or `unknown`).
