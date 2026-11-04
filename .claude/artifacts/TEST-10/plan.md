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
> (ClickUp task [TEST-10: Footer shows the build commit](https://app.clickup.com/t/123k99cwybm).)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 23 comments, all earlier runs' "PR opened" notices → not acted on: none carries a requirement, and none of those runs' code survives on main 5796772 except TEST-08 (#528) and TEST-09 (#526), which this plan builds on.
- Assumption (criterion 2, "the version alone" while pending or failed): the version and the commit arrive in the **same** `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. TEST-08 recorded that decision on main: pending and failed both render exactly `Task Notes`. This plan keeps it. "The version alone" is read as "no commit, and whatever TEST-08 shows for the version in that state". So pending and failure render exactly `Task Notes`, with no `undefined`, no `null`, no error text and no empty parentheses. The case where "the version alone" is literally visible is a successful response whose commit is not usable (next line): the footer then reads `Task Notes v0.1.0`.
- Assumption (commit missing, blank or `"unknown"`): TEST-09's backend answers `commit: "unknown"` when `BUILD_COMMIT` is unset or blank. That is the value CI and a plain `docker compose up` produce today, because `pr-tests.yml` passes no `BUILD_COMMIT`. The client maps each of these to "no commit": `commit` absent, not a string, blank after trimming, or exactly `"unknown"`. The footer then shows the version alone. A bad `commit` never fails the request and never hides a valid version: only `version` is validated strictly, as TEST-08 left it.
- Assumption (7 versus 12 characters): the backend returns up to 12 characters (TEST-09, `COMMIT_LENGTH = 12`). The frontend client shortens the trimmed value to its first 7 with `slice(0, 7)`. A commit shorter than 7 characters, such as `abc12`, is shown unchanged.
- Assumption (commit known, version `"unknown"`): the commit renders only next to a version (criterion 1: "next to the version"). When the client resolves `version: null`, the footer reads `Task Notes` and shows no commit.
- Assumption (display format): `Task Notes v0.1.0 (5796772)`. The commit sits in its own `<span data-testid="app-commit">`, a sibling after TEST-08's `app-version` span, and its text is ` (5796772)`. The `app-version` span keeps exactly TEST-08's text, ` v{version}`. Design Reference mode is NONE, so the parentheses are a freestyle choice: they separate the commit from the version without adding a label.
- Repository finding (the notes' "frontend only"): this holds. TEST-09 already serves `commit` on main 5796772 (`backend/app/schemas/version.py` declares `commit: str`), so this plan writes no backend file.
- Repository finding (TEST-08's E2E spec): `e2e/tests/TEST-08_footer_app_version.spec.ts` asserts the footer's **exact** text `Task Notes v{version}`. It passes today only because CI builds with no `BUILD_COMMIT`. Once a commit renders, any run with `BUILD_COMMIT` set (a developer's local stack, a future CI that passes the sha) would fail it. The plan narrows that one assertion to the version part (see File Manifest). It leaves TEST-08's failure-path assertion (`toHaveText("Task Notes")`) unchanged, because this plan keeps that state.
- Merged since the last plan: n/a (fresh plan; no earlier TEST-10 plan exists; branched from current main 5796772).

## Plan Overview
Frontend-only change on top of TEST-08's footer and TEST-09's endpoint. The client `frontend/src/api/version.ts` keeps its name, `fetchBackendVersion`, but resolves a `BackendVersion` object `{ version: string | null; commit: string | null }` instead of `string | null`. `version` keeps TEST-08's rules. `commit` is the response's `commit`, trimmed and shortened to its first 7 characters, or `null` when it is missing, blank or `"unknown"`. `AppFooter.tsx` holds that object and renders a commit span after the version span only when both are present. The unit tests and `LandingPage.test.tsx`'s mock move to the new return shape. A new E2E spec checks the commit through the browser, and TEST-08's spec drops its exact-text assumption. No backend code, no new dependency, no change to `LandingPage.tsx`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify). Rename the exported type to `VersionResponse = { version: string; commit?: string }`, the wire shape. Add the exported type `BackendVersion = { version: string | null; commit: string | null }`. Add `const COMMIT_DISPLAY_LENGTH = 7`, with a comment saying why: the footer shows the conventional short sha, and the backend sends up to 12. `fetchBackendVersion(): Promise<BackendVersion>` keeps every existing rejection unchanged: non-2xx, network error, and a non-object body or bad `version`, with the same error messages. `version` keeps TEST-08's mapping: trimmed, and `"unknown"` becomes `null`. New `commit` mapping: a string that is non-empty after trimming and not `"unknown"` becomes `trimmed.slice(0, COMMIT_DISPLAY_LENGTH)`; anything else becomes `null`, and nothing throws.
  - `frontend/src/components/AppFooter.tsx` (modify). Change the state to `useState<BackendVersion | null>(null)`, and keep the mount-only effect, the `isMounted` guard and the swallowed rejection. Render `{APP_NAME}`, then `{version !== null && <span data-testid="app-version"> v{version}</span>}`, then `{version !== null && commit !== null && <span data-testid="app-commit"> ({commit})</span>}`, where `version` and `commit` are read off the state, or `null` while it is `null`. Update the comment to cover the commit. Keep `footerStyle`, `APP_NAME`, the `app-footer` test id and the `contentinfo` landmark.
- Routes: none (the landing page at `/` is unchanged; `LandingPage.tsx` is not touched).
- State management: local `useState` in `AppFooter`, one fetch per mount, no retry and no polling, as in TEST-08.
- Pending, failed and no-commit states (criterion 2): pending and failed render exactly `Task Notes`; a success with no usable commit renders `Task Notes v{version}`; a success with a commit renders `Task Notes v{version} ({7-char commit})`.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The footer keeps TEST-04's style unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`). The `app-commit` span, like `app-version`, carries no style of its own and inherits it.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": "<string>", "commit": "<string>"}` on main 5796772 (TEST-09). `commit` holds at most the first 12 characters of `BUILD_COMMIT`, or `"unknown"` when that is unset or blank.

## API Integration Plan
No external API integration. (The frontend consumes the project's own backend; the contract is below.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (`frontend/src/api/baseUrl.ts`, unchanged)
- Request: no body, no query parameters, no custom headers.
- Response (unchanged, TEST-09): 200 with `{"version": "0.1.0", "commit": "5796772ab1cd"}`, or `{"version": "0.1.0", "commit": "unknown"}` when `BUILD_COMMIT` is unset.
- Client result (`BackendVersion`): `{"version": "0.1.0", "commit": "5796772"}` in the first case and `{"version": "0.1.0", "commit": null}` in the second. A body with `"version": "unknown"` gives `version: null`. A non-2xx status, a network error or a malformed `version` rejects.
- Footer: `Task Notes v0.1.0 (5796772)`, `Task Notes v0.1.0`, or `Task Notes`.

## Technology Selection
- Commit shortening in `version.ts`: chose the standard `String.prototype.trim` and `slice` over a git or sha-formatting library, because the value is already a string and slicing it needs nothing else.
- Footer commit rendering: chose React's built-in `useState` and conditional JSX (react is already installed), extending TEST-08's existing state, over a data-fetching library or a second request. One response already carries both fields.
- Commit validation: chose a plain `typeof` check alongside the existing `version` check over a schema library (zod or similar), because the body has two string fields.
- E2E fixed-commit response: chose Playwright's built-in `page.route(...).fulfill` (already installed) over rebuilding the stack with `BUILD_COMMIT`. CI builds with no `BUILD_COMMIT`, so only a fulfilled response can show a known commit in the browser on every run.
- No net-new module or dependency is introduced, so no lockfile changes.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright specs: a fulfilled `/api/version` with a 12-character commit shows its first 7 next to the version; the live backend's response and the footer agree; an aborted request leaves the footer reading `Task Notes`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the "commit unknown" edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: resolve `BackendVersion` `{ version, commit }`; commit trimmed and shortened to 7, or `null` when missing, blank or `"unknown"`; version rules and rejections unchanged
- [A] frontend/src/api/version.test.ts: assertions move to the object shape; new commit cases (12 characters to 7, shorter unchanged, `"unknown"`, blank, missing and non-string all give `null`, surrounding whitespace trimmed, a bad commit does not reject)
- [A] frontend/src/components/AppFooter.tsx: hold the `BackendVersion` object; render the `app-commit` span ` ({commit})` after `app-version` only when both are present
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve the object shape; add success with commit, success without commit, pending and failure paths asserting the exact footer text
- [A] frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves `{ version: "9.9.9", commit: null }` instead of `"9.9.9"`; its assertions are unchanged
- [D] e2e/helpers/backendVersion.ts: add `openLandingPageAndReadBackendBuild(page)`, which returns the page's own `/api/version` body `{ version, commit }`; the existing `openLandingPageAndReadBackendVersion` and `isVersionApiUrl` are unchanged
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the success test asserts `app-version` reads `v{version}` and the footer contains `Task Notes v{version}`, instead of exact footer text, so a set `BUILD_COMMIT` no longer fails it; the failure test is unchanged

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the project structure, run configuration, dependencies and test infrastructure are unchanged, and neither document describes the footer. `frontend/src/components/LandingPage.tsx` and the TEST-04 specs and UAT artifacts are not modified. TEST-04's spec uses `toContainText`, which stays true with a commit appended.

## Testing Strategy
- Unit tests (Vitest, frontend; the backend gets no new code, so no new pytest tests):
  - `frontend/src/api/version.test.ts`. A 200 with `{"version": "0.1.0", "commit": "5796772ab1cd"}` resolves `{version: "0.1.0", commit: "5796772"}`. A commit of `"abc12"` resolves unchanged. A commit of `"  5796772ab1cd  "` resolves `"5796772"`. Each of `"unknown"`, `""`, `"   "`, missing and `7` resolves `commit: null` without rejecting. `{"version": "unknown", "commit": "5796772ab1cd"}` resolves `version: null`. The existing rejection cases (503, network error, malformed `version`) and the base-URL case are kept.
  - `frontend/src/components/AppFooter.test.tsx` mocks `../api/version`. Success with commit: `{version: "9.9.9", commit: "abc1234"}` gives a footer reading exactly `Task Notes v9.9.9 (abc1234)`, an `app-commit` span reading `(abc1234)`, and an `app-version` span reading `v9.9.9`. Success without commit: `{version: "9.9.9", commit: null}` gives exactly `Task Notes v9.9.9` with no `app-commit`. Pending: a never-settling promise gives exactly `Task Notes` with neither span. Failure: a rejection gives exactly `Task Notes` with neither span and no `undefined`, `null` or error text. Version unknown: `{version: null, commit: "abc1234"}` gives exactly `Task Notes` with neither span. The existing package.json, landmark and once-per-mount tests move to the object shape.
  - `frontend/src/components/LandingPage.test.tsx`: the mock moves to the object shape and the existing footer test is kept.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`, the existing frontend convention. CLAUDE.md's `backend/tests/unit/` and `test_{module}_unit.py` apply to backend tests, and this item adds none.)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing frontend tests
- Integration tests: none new. The only router involved, `GET /api/version`, is unchanged. `backend/tests/integration/test_version_integration.py` (TEST-05, TEST-09) already covers its set and unset commit paths and runs in this build's gate.
  - Directory: `backend/tests/integration/`
- E2E tests: one spec file, three tests, against the live stack.
  - Known commit (criterion 1): `page.route` fulfills requests whose **exact** pathname is `/api/version` (`isVersionApiUrl`, never a substring, because Vite serves `/src/api/version.ts`) with status 200 and body `{"version": "0.1.0", "commit": "5796772ab1cd"}`. Open `/`. Assert that `app-commit` reads `(5796772)`, that `app-footer` reads `Task Notes v0.1.0 (5796772)`, and that the footer does not contain `5796772ab1cd`.
  - Live backend (criterion 1, end to end): call `openLandingPageAndReadBackendBuild(page)`. If the live `commit` is `"unknown"` (the CI case), assert that the footer reads `Task Notes v{version}` and has no `app-commit`. Otherwise assert that `app-commit` reads `({first 7 of commit})`.
  - Failure (criterion 2): `page.route` aborts the exact `/api/version` path. Wait for the `requestfailed` event, then assert that the footer reads exactly `Task Notes`, that neither span exists, and that the footer does not match `/undefined|null|unknown|error/i`.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one scenario per criterion, plus the edge case "the backend runs with no BUILD_COMMIT, and the footer shows the version alone".
  - Directory: `e2e/uat/scenarios/` (Gherkin), `e2e/uat/scripts/` (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or failed, the footer shows the version alone (per Re-Plan Feedback: `Task Notes`), never `undefined` or an error | Unit | Pending and failed are component states set by mocking the client (a never-settling promise and a rejection), with no navigation or interaction needed. The E2E failure test also exercises the failed state in the browser. |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion is itself a component-test requirement, met by `AppFooter.test.tsx`. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfill the exact-path `/api/version` with commit `5796772ab1cd`, open `/`, and assert the footer reads `Task Notes v0.1.0 (5796772)`; then, against the live backend, assert the footer agrees with the response | Given the backend was built with BUILD_COMMIT set to a full sha, When I open the landing page, Then the footer shows the version followed by the first 7 characters of that sha in parentheses |
| 2 | Pending or failed shows no commit and no `undefined` or error | Covered at Unit, see Criterion coverage; the E2E failure test aborts `/api/version` and the footer reads `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no "undefined", "null" or error text |
| 3 | Component test covers success, pending and failure | Covered at Unit, see Criterion coverage | Given the frontend unit tests, When I run them, Then the AppFooter success, pending and failure tests pass |

## Manual verification plan

### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running. Run from the repository root, with no other stack on ports 8010 and 5183.
1. Run `git rev-parse HEAD` → it prints the full 40-character sha of your checkout, for example `5796772` followed by 33 more characters. Note its first 7 characters.
2. Run `BUILD_COMMIT=$(git rev-parse HEAD) docker compose up -d --build` → the db, backend and frontend containers start (`docker compose ps` lists all three as running).
3. Run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0","commit":"..."}`, where `commit` is the first 12 characters of the sha from step 1.
4. Open `http://localhost:5183/` in a browser and scroll to the footer → it reads exactly `Task Notes v0.1.0 (5796772)`, with your 7 characters from step 1 inside the parentheses, and none of the remaining 5 characters from step 3.
5. In DevTools Elements, inspect the footer → it holds a span `app-version` with text ` v0.1.0`, followed by a span `app-commit` with text ` (5796772)`.

### Criterion 2: While pending or failed, the footer shows no commit and never `undefined` or an error
Prerequisites: the stack from criterion 1 is running, in a Chromium-based browser.
1. Open DevTools Network, right-click any request, choose "Block request URL", and enter the pattern `localhost:8010/api/version` → the block rule is listed.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no version, no parentheses, and no `undefined`, `null` or error text. The Network tab shows `/api/version` as blocked.
3. Remove the block rule, set Network throttling to "Slow 3G", and reload → while `/api/version` is still pending, the footer reads exactly `Task Notes`. Once the request completes, it reads `Task Notes v0.1.0 (5796772)`.
4. Set throttling back to "No throttling", then run `docker compose up -d --build backend` without `BUILD_COMMIT` set → `curl -s http://localhost:8010/api/version` shows `"commit":"unknown"`.
5. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0` (the version alone), with no `unknown` and no empty `()`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repository root → it ends with `0 failed`, and `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` are among the files run.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains tests asserting each of these exact footer texts: `Task Notes v9.9.9 (abc1234)` (success with commit), `Task Notes v9.9.9` (success without commit), `Task Notes` for a never-settling promise (pending), and `Task Notes` for a rejected promise (failure).
3. Run `docker compose down` → the stack stops.
