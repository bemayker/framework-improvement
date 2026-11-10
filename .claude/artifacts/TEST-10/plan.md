# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria.**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (ClickUp task 123k99cwybm.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 36 comments read by the dispatching session (decisions.md, this run), all framework "PR opened" notes from earlier runs → not acted on because none states a requirement for this item.
- Merged since the last plan: n/a (fresh plan). Plan base is origin/main @ 0b16aad; origin/main has since moved to 4cd1e51, which adds only `docs/runs/deliver-20261110T131433Z/` files and touches no path in this manifest.
- Assumption (ambiguity, recorded rather than blocking; `user_story_alignment.md` Section 4): criterion 2's "the version alone" is read against TEST-08's delivered footer, which is driven by the same `/api/version` request. While that request is pending, or when it fails (unreachable, non-OK, unusable body, version sentinel `unknown`), the footer renders exactly what TEST-08 renders today, `Task Notes`, because no version is known yet. When the request succeeds with a usable version but the commit is unusable (missing, non-string, empty, or TEST-09's `unknown` sentinel, which is what every local run without `BUILD_COMMIT` returns), the footer renders the version alone: `Task Notes v0.1.0`. In no case does the commit appear without a version, and in no case does the footer show `undefined`, `null`, `unknown` or an error.
- Assumption (format): the commit is shown in parentheses after the version, separated by one space: `Task Notes v0.1.0 (abc1234)`. The description fixes "next to the version" and nothing more; parentheses keep the version string itself unchanged so TEST-08's and TEST-04's substring checks stay true.
- Assumption (where the 7-character cut happens): the backend already returns 12 characters (TEST-09). The frontend client cuts to 7; the backend is not changed (the item is frontend only).

## Plan Overview
Frontend only. The existing client `frontend/src/api/version.ts` is widened from returning the version string to returning the build info the endpoint already carries: `{ version, commit }`, with `commit` cut to 7 characters or `null` when unusable. The function is renamed `fetchBackendBuildInfo` because it no longer returns only a version. `AppFooter.tsx` renders `Task Notes v{version} ({commit})`, `Task Notes v{version}`, or `Task Notes`. One request, unchanged URL, no new dependency, no backend change. Tests that mock or assert the old client shape are updated: the client and AppFooter unit tests, the LandingPage component test's mock, and TEST-08's E2E spec whose exact-text assertion would break once a commit is appended.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify):
    - `VersionResponse` becomes `{ version: string; commit: string }`, mirroring `backend/app/schemas/version.py` as it now stands.
    - New exported type `BuildInfo = { version: string; commit: string | null }`.
    - Rename `fetchBackendVersion()` to `export async function fetchBackendBuildInfo(): Promise<BuildInfo | null>`. Same URL (`${API_BASE_URL}/api/version`), same never-throws contract.
    - Returns `null` exactly where `fetchBackendVersion` returned `null` today (rejected fetch, non-OK status, `version` missing, non-string, empty or `"unknown"`). The version rules are unchanged.
    - Otherwise returns `{ version, commit }` where `commit` is `body.commit.slice(0, SHORT_COMMIT_LENGTH)` with `const SHORT_COMMIT_LENGTH = 7`, or `null` when `body.commit` is missing, not a string, empty, or the sentinel `"unknown"` (reuse the existing `UNRESOLVED_SENTINEL` constant; update its comment to say both fields use it).
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BuildInfo | null>(null)`, fetched once on mount with the existing `isMounted` guard. Rendered text, built by a small pure function in the same file (`footerText(info)`):
    - `info === null` (pending or failed): `Task Notes`
    - `info.commit === null`: `Task Notes v{version}`
    - otherwise: `Task Notes v{version} ({commit})`
    `footerStyle`, the `<footer>` element and `data-testid="app-footer"` are unchanged. No separate element for the commit, so the footer stays one text node and the existing exact-text tests keep their meaning.
  - `frontend/src/components/LandingPage.tsx`: **not modified.**
- Routes: none.
- State management: local `useState` + `useEffect` in `AppFooter`, as today.
- Design reference notes: AI freestyle. Design Reference mode is NONE. Keep the existing footer styling (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the commit uses the same style as the rest of the footer text, in the format `Task Notes v{version} ({commit})`.

## Backend Plan
No backend changes required. TEST-09 (#707) already returns `commit` from `GET /api/version` (first 12 characters of `BUILD_COMMIT`, `"unknown"` when unset or blank), covered by `backend/tests/integration/test_version_integration.py`.

## API Integration Plan
No external API integration. The footer consumes this project's own `GET /api/version`, specified under `## API Contract`.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL` from `frontend/src/api/config.ts`, unchanged)
- Request: no body, no parameters.
- Response: 200, `application/json`, for example `{"version": "0.1.0", "commit": "4cd1e5165d85"}`, or `{"version": "0.1.0", "commit": "unknown"}` when `BUILD_COMMIT` is unset (the docker-compose default).
- Frontend client contract: `fetchBackendBuildInfo(): Promise<BuildInfo | null>`. For the first example it returns `{ version: "0.1.0", commit: "4cd1e51" }`; for the second `{ version: "0.1.0", commit: null }`; `null` on network error, non-2xx, or an unusable `version`. Never throws.

## Technology Selection
- No net-new component, module or dependency: the change extends the existing `version.ts` client (native `fetch`, already used) and the existing `AppFooter` (React `useState`/`useEffect`, already installed). The 7-character cut is `String.prototype.slice`, a standard-library call, over any formatting helper. `frontend/package.json` and `frontend/package-lock.json` are unchanged.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs with `/api/version` fulfilled by `page.route` so the commit is deterministic: (a) body `{"version":"0.1.0","commit":"abcdef123456"}` gives footer text exactly `Task Notes v0.1.0 (abcdef1)`; (b) edge case, body `{"version":"0.1.0","commit":"unknown"}` gives exactly `Task Notes v0.1.0`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the unknown-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script that build-feature writes

### Modified files
- [A] frontend/src/api/version.ts: `fetchBackendVersion` renamed `fetchBackendBuildInfo`, returning `{ version, commit }` with the commit cut to 7 characters or `null` when unusable; `VersionResponse` gains `commit`
- [A] frontend/src/api/version.test.ts: retarget to `fetchBackendBuildInfo`; keep every existing `null` case; add: 12-character commit returns its first 7, commit `"unknown"` returns `commit: null`, commit missing, empty or non-string returns `commit: null` with the version kept, commit shorter than 7 characters is returned as-is
- [A] frontend/src/components/AppFooter.tsx: hold `BuildInfo | null`; render `Task Notes v{version} ({commit})`, `Task Notes v{version}` or `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock `fetchBackendBuildInfo`; success path exact text `Task Notes v1.2.3 (abc1234)`; pending path (never-resolving promise) exact text `Task Notes`; failure path (resolves `null`) exact text `Task Notes` with no `undefined`, `null`, `unknown`; version-without-commit path exact text `Task Notes v1.2.3`; keep the contentinfo-landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock `fetchBackendBuildInfo` instead of `fetchBackendVersion` (resolving `{ version: "1.2.3", commit: "abc1234" }`), so the file still type-checks under `tsc -b` and its footer assertion still finds `Task Notes v1.2.3`; no note-form or note-list test is touched
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: spec (a) asserts exact text `Task Notes v{version}`, which becomes false when the live backend has a `BUILD_COMMIT`; change it to expect `Task Notes v{version}` followed by ` ({first 7 of commit})` when the captured body's commit is not `"unknown"`, and exactly `Task Notes v{version}` when it is. Spec (b) (aborted request gives exactly `Task Notes`) is unchanged and is this item's failure-path browser check

No dependency changes, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure. `e2e/tests/TEST-04_page_footer.spec.ts` uses `toContainText("Task Notes")` and stays true unchanged. TEST-08's and TEST-09's historical UAT artifacts are not edited.

## Testing Strategy
- Unit tests: the `fetchBackendBuildInfo` client (commit cut, every commit-unusable branch, every existing version-unresolved branch) and `AppFooter` (success, pending, failure, and version-without-commit), with `../api/version` mocked in the component test.
  - Directory: `frontend/src/`, co-located `*.test.ts(x)` (the existing Vitest convention; CLAUDE.md's `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests use
- Integration tests: none new. The backend is unchanged and `backend/tests/integration/test_version_integration.py` already covers the `commit` field; the frontend has no integration tier.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: one new spec file with `/api/version` fulfilled by `page.route` (deterministic commit, no host port hardcoded): commit shown, and the unknown-commit edge case. TEST-08's spec (a) is adjusted so it holds with or without a build commit.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | Verifying it needs no navigation or interaction: the pending state is held deterministically only by a never-resolving mocked promise, and each failure branch is a client/component rule, asserted exactly in `version.test.ts` and `AppFooter.test.tsx` (TEST-08's aborted-request spec and this item's unknown-commit spec add browser edge cases) |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion is itself a component test (`AppFooter.test.tsx`) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Spec (a): `page.route` fulfils `/api/version` with commit `abcdef123456`; goto `/`; footer has text exactly `Task Notes v0.1.0 (abcdef1)` | Given the backend runs with BUILD_COMMIT set, When I open the landing page, Then the footer reads "Task Notes v0.1.0" followed by the first 7 characters of the commit in parentheses |
| 2 | Pending or failed request shows the version alone | covered at Unit, see Criterion coverage (spec (b) is the unknown-commit edge case) | Given the backend runs without BUILD_COMMIT, When I open the landing page, Then the footer reads exactly "Task Notes v0.1.0" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
Common prerequisites: Docker running, the repo root as the working directory. The frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`; the backend version is `0.1.0` (`backend/pyproject.toml`).

### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef0123 docker compose up -d --build`.
1. Open `http://localhost:8010/api/version` in a browser tab → JSON `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters, from TEST-09).
2. Open `http://localhost:5183/` → the landing page shows the heading "Task Notes".
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, a space, and the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone
Prerequisites: the stack is running as in Criterion 1.
1. Open `http://localhost:5183/`, open DevTools → Network, set throttling to "Slow 3G", and reload → while the `/api/version` request is pending the footer reads exactly `Task Notes` (no version is known yet, so there is nothing to show beside it), with no `undefined`, no error and no empty parentheses. When the request finishes it changes to `Task Notes v0.1.0 (0123456)`. Reset throttling to "No throttling".
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text.
3. Restart the backend without a commit: `docker compose up -d --build backend` (no `BUILD_COMMIT` set, so the compose default `unknown` applies). Open `http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"unknown"}`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: the version alone, with no `(unknown)` and no empty parentheses.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test names include a success case (version and commit), a pending case and a failure case.
