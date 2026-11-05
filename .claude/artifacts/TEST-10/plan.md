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
- [orchestrator, /deliver Section 6.2 step 3, run deliver-20261105T084022Z] 1. Add `[D] e2e/tests/TEST-08_footer_app_version.spec.ts` to Modified files: its first test asserts `app-footer` has the exact text `Task Notes v{backendVersion}` against the real backend, which this item's `({commit})` suffix breaks whenever the stack runs with `BUILD_COMMIT` set. **Addressed:** verified on main (line 26 of that spec); added to `### Modified files` as a `[D]` entry, bounded to that one assertion, which becomes `toContainText` of `Task Notes v{backendVersion}`; the exact `app-footer-version` check (`v{backendVersion}`) and the `not.toContainText` of `v{frontendVersion}` stay, and the second test (route aborted, footer reads `Task Notes`) is unchanged. Mirrored in shared_risks.md under "Existing files this feature will modify", replacing the former non-file risk line.
- [orchestrator] 2. Mark CHORE-02 in shared_risks.md as cancelled in the tracker and not a node of this run. **Addressed:** confirmed in ClickUp (task 123k99cx6mf, status `cancelled`); the shared_risks.md line now says so and asks for no serialization. No plan change.
- Everything else stands as written, per the orchestrator; no other section was re-opened.

## Plan Overview
Frontend only. Both dependencies are on main (f6dc1be): TEST-09 (#575) makes `GET /api/version` answer `{"version": "...", "commit": "..."}`, where `commit` is the first 12 characters of `BUILD_COMMIT` or the sentinel `"unknown"` (backend/app/services/version_service.py, backend/app/core/config.py). TEST-08 (#576) made `AppFooter` fetch that endpoint at runtime through `getBackendVersion()` in frontend/src/api/version.ts and render `Task Notes` alone while pending, on failure, or when the version is unusable.

This item extends the one existing request rather than adding a second one:

1. `frontend/src/api/version.ts`: `getBackendVersion()` now resolves a `BackendVersion` object `{ version: string; commit: string | null }` (or `null`, unchanged, when the version itself is unusable). `commit` is the response's `commit` cut to its first 7 characters (`SHORT_COMMIT_LENGTH = 7`), or `null` when the field is missing, not a string, empty or the `"unknown"` sentinel. A bad or absent `commit` never rejects the call: the version is still good, and criterion 2 wants the version shown without it.
2. `frontend/src/components/AppFooter.tsx`: stores the resolved object; renders `Task Notes v{version} ({commit})`, with the commit in its own `<span data-testid="app-footer-commit">({commit})</span>` placed right after the version span, only when both the version and the commit are present.
3. `e2e/tests/TEST-08_footer_app_version.spec.ts`: one assertion in its first test is relaxed so it holds with or without the commit span (see Testing Strategy).

Assumptions (recorded per `user_story_alignment.md` Section 4, autonomous mode; no blocking question):

- **Criterion 2 against TEST-08's runtime fetch.** The criterion was written when the version was expected to be on screen independently of the request; after TEST-08 the version itself comes from the same `GET /api/version` call. While that call is pending or after it fails there is no version to show, so the footer shows exactly what TEST-08 shows in that state, `Task Notes`, with no commit, no `undefined` and no error text. "Version alone" is honoured in the one state where a version exists without a commit: the response carries a usable version but its `commit` is `"unknown"`, empty, missing or not a string, and the footer then shows `Task Notes v{version}` with no commit span.
- **Format.** `(abc1234)` in parentheses after the version, separated by one space, is the chosen rendering of "next to the version"; Design Reference mode is NONE, so the footer's existing style (0.875rem, #5f5f5f, inherited) applies with no new styling.
- **7 characters is cut client-side.** The backend sends up to 12 (TEST-09); the frontend takes the first 7. A commit shorter than 7 characters is shown as sent.
- **Function name kept.** `getBackendVersion` keeps its name and only widens its return type, so the two existing component tests that mock it keep their mock shape and change only the resolved value.

## Frontend Plan
- Components to create/modify:
  - frontend/src/api/version.ts: add `export type BackendVersion = { version: string; commit: string | null }`, add `commit?: unknown` handling to the parsed body, export `SHORT_COMMIT_LENGTH = 7`, reuse a `BACKEND_UNKNOWN_COMMIT = "unknown"` sentinel (same literal as the version sentinel, named separately because the backend defines them separately), change the return type to `Promise<BackendVersion | null>`. Error behaviour unchanged: non-OK response and a body without a string `version` still reject.
  - frontend/src/components/AppFooter.tsx: state becomes `BackendVersion | null`; the version span is unchanged (`data-testid="app-footer-version"`, text `v{version}`); a commit span `data-testid="app-footer-commit"` with text `({commit})` follows it after one space, rendered only when `commit !== null`.
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (mount-time effect, `isMounted` guard, swallowed rejection).
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is at most 12 characters, `"unknown"` when the backend has no `BUILD_COMMIT`.
- Frontend client contract (`getBackendVersion()` in frontend/src/api/version.ts):
  - resolves `{ version: "0.1.0", commit: "0123456" }` for the body above;
  - resolves `{ version: "0.1.0", commit: null }` when `commit` is `"unknown"`, `""`, missing or not a string;
  - resolves `null` when `version` is `""` or `"unknown"` (unchanged from TEST-08);
  - rejects on a non-OK status or a body whose `version` is not a string (unchanged from TEST-08).

## Technology Selection
- Short commit: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency; nothing else is needed.
- No net-new component, module or dependency: the feature extends the existing `version.ts` client and `AppFooter` component and installs nothing.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 (commit shown next to the version on the landing page) plus the edge case (sentinel commit, version shown alone), with `/api/version` fulfilled by `page.route` so the result does not depend on the environment's `BUILD_COMMIT`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `BackendVersion` type, `SHORT_COMMIT_LENGTH`, commit parsing and truncation, widened return type
- [A] frontend/src/api/version.test.ts: commit cases (truncated to 7, shorter than 7 kept, sentinel, empty, missing, non-string all give `commit: null` with the version kept); existing cases updated to the object shape, including the "ignores extra fields" case
- [A] frontend/src/components/AppFooter.tsx: render the commit span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: success path with commit (`Task Notes v0.1.0 (0123456)`), version with null commit (`Task Notes v0.1.0`, no commit span), pending and failure paths asserting `Task Notes` exactly with neither span and no `undefined`; existing cases updated to the object shape
- [A] frontend/src/components/LandingPage.test.tsx: the `getBackendVersion` mock resolves the object shape instead of the bare string, so the page-level footer assertion keeps passing
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: in the first test only, the exact-text assertion on `app-footer` (`toHaveText` of `Task Notes v{backendVersion}`) becomes `toContainText` of `Task Notes v{backendVersion}`, so it holds with or without the commit span; the exact `app-footer-version` check and the `not.toContainText` of `v{frontendVersion}` stay, and the second test (route aborted, footer reads `Task Notes`) is unchanged

No dependency is added or changed, so no lockfile changes. Neither README.md nor docs/DEVELOPMENT.md needs an edit: project structure, run configuration, dependencies and test infrastructure are unchanged (`BUILD_COMMIT` is already documented in .env.example and README.md by TEST-09).

## Testing Strategy
- Unit tests: Vitest, colocated with the source (frontend convention already in the repo; CLAUDE.md's unit directory and naming are the backend's).
  - frontend/src/api/version.test.ts: the client's parsing and truncation rules listed under API Contract.
  - frontend/src/components/AppFooter.test.tsx: the component test criterion 3 asks for, covering success (version plus commit), version with no usable commit, pending, and failure (rejection and `null`).
  - frontend/src/components/LandingPage.test.tsx: mock shape update only.
  - Directory: frontend/src/ (colocated `*.test.ts(x)`)
  - Naming: `{Module}.test.ts(x)`, matching the existing files
- Integration tests: none warranted. No repository, model, migration or endpoint changes; the endpoint's `commit` field is already covered by TEST-09's backend integration tests.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec file for criterion 1, plus one edge-case spec (backend reports the `"unknown"` commit, footer shows `Task Notes v0.1.0` and no commit span). `/api/version` is fulfilled through `page.route` with a fixed body, so the spec is deterministic whatever `BUILD_COMMIT` the stack was started with. Locators: `app-footer`, `app-footer-version`, `app-footer-commit` test ids.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
  - Existing spec kept green: e2e/tests/TEST-08_footer_app_version.spec.ts, whose first test's whole-footer exact-text assertion would otherwise fail on the `({commit})` suffix in any run where the stack has `BUILD_COMMIT` set (a local run started as README.md documents); only that one assertion is relaxed to `toContainText`, as listed in the File Manifest.
- UAT scenarios: one scenario per criterion plus the sentinel-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | verifying it needs no navigation or interaction: it is the component's rendering in the pending, rejected and null-commit states, which the component test drives directly through the mocked client; the request-abort case is already a browser spec in TEST-08 |
| 3 | A component test covers the success, pending and failure paths. | Unit | the criterion is itself a component test (frontend/src/components/AppFooter.test.tsx); it is satisfied by that test existing and passing, not by a browser flow |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | Fulfil `**/api/version` with `{"version": "0.1.0", "commit": "0123456789ab"}`, open `/`, expect `app-footer-commit` to have text `(0123456)` and `app-footer` to have text `Task Notes v0.1.0 (0123456)`. Edge: commit `"unknown"` gives `Task Notes v0.1.0` and zero `app-footer-commit` elements | Given the backend reports version 0.1.0 and commit 0123456789ab, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows no commit, never `undefined` or an error | covered at Unit, see Criterion coverage | Given the version request fails, When I open the landing page, Then the footer reads "Task Notes" with no commit and no error text |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component test, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: the stack is started from the repository root with `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`, and the frontend answers at http://localhost:5183.
1. Open http://localhost:8010/api/version in the browser → the JSON shows `"commit": "0123456789ab"` and a `"version"` value, for example `"0.1.0"`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form and the footer.
3. Read the footer at the bottom of the page → it reads `Task Notes v0.1.0 (0123456)`: the same version as step 1, then exactly 7 commit characters in parentheses.
4. Restart the stack with `BUILD_COMMIT=abc docker compose up -d --build` and reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0 (abc)`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from Criterion 1 is running with `BUILD_COMMIT=0123456789abcdef`; the browser's developer tools are open on the Network tab.
1. In the Network tab, set throttling to "Slow 3G" and reload http://localhost:5183/ → while the `version` request is still pending, the footer reads `Task Notes` with no version, no commit, and no `undefined`.
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0 (0123456)`.
3. Set throttling back to "No throttling", right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes`; no error message, no `undefined`, and no parentheses appear anywhere in the footer.
4. Remove the block, restart the stack with `docker compose up -d --build` without setting `BUILD_COMMIT`, and reload → http://localhost:8010/api/version shows `"commit": "unknown"` and the footer reads `Task Notes v0.1.0` with no commit and no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths.
Prerequisites: frontend dependencies are installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`.
2. Open frontend/src/components/AppFooter.test.tsx → there is one test each for the success path with a commit, the version with no usable commit, the pending request, and the failed request (rejection), and each asserts the footer's exact text.
