# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 22 comments on the ClickUp task, all framework PR-opened notes from earlier runs, as counted by the dispatching session and recorded in `decisions.md` → Not acted on because none states a requirement, a correction or an amendment to the description.
- Assumption (format): the commit is rendered in parentheses after the version, on the same footer line: `Task Notes v0.0.0 (0123456)`. "Next to the version" names no separator; parentheses keep the existing `Task Notes v{version}` text intact as a prefix, so TEST-04's and TEST-08's `toContainText` assertions stay true.
- Assumption (backend sentinel): TEST-09 returns `commit: "unknown"` when `BUILD_COMMIT` is unset. That is a string of exactly 7 characters and is rendered as returned (`Task Notes v0.0.0 (unknown)`); the frontend does not special-case the backend's sentinel, so no second copy of that value exists on the client. A response whose `commit` is missing, not a string, or blank after trimming is treated as a failed request (criterion 2) and shows the version alone.
- Assumption (where the fetch lives): `AppFooter` fetches on mount itself, so `LandingPage.tsx` is not modified (the scheduler's flagged overlap with BUG-04 does not apply to that file). `LandingPage.test.tsx` is modified only to mock the new client module, because `LandingPage` renders `AppFooter` and a unit test must not make a real network call (`testing_standards.md` Section 1.1).
- Assumption (base URL): the backend base URL is currently declared inside `frontend/src/api/notes.ts`. A second client must not declare it again (`coding_standards.md` Section 5, one value, one source), so it moves to a new `frontend/src/api/apiBaseUrl.ts` that both clients import; `notes.ts` behaviour is unchanged and its existing tests keep passing.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch; plan base d86341c is `origin/main`).

## Plan Overview
TEST-08 left `frontend/src/components/AppFooter.tsx` rendering `Task Notes v{version}` from `frontend/package.json`; TEST-09 made `GET /api/version` return `{"version": ..., "commit": ...}` with a commit of at most 12 characters (verified on main: `backend/app/routers/version.py`). This item adds a frontend client for that endpoint and has the footer append the first 7 characters of `commit` once the request succeeds.

- New client module `frontend/src/api/version.ts` with `getVersionInfo()`, following the `notes.ts` pattern (throw on a non-OK response) plus a shape check on `commit`.
- New `frontend/src/api/apiBaseUrl.ts` holding `API_BASE_URL` (read from `VITE_API_BASE_URL`, default `http://localhost:8010`), moved out of `notes.ts`.
- `AppFooter` keeps its `version` prop and gains local state `commit: string | null` (initially `null`), set in a mount-time `useEffect` with the same unmount guard `LandingPage` uses; a rejection leaves it `null`.
- Frontend only. No backend change, no new dependency, no new route.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): `const DEFAULT_API_BASE_URL = "http://localhost:8010";` and `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;`, moved verbatim from `notes.ts`, with the comment that it is the single declaration both clients read.
  - `frontend/src/api/notes.ts`: delete its own `DEFAULT_API_BASE_URL` and `API_BASE_URL` and `import { API_BASE_URL } from "./apiBaseUrl";`. Nothing else changes.
  - `frontend/src/api/version.ts` (new): `export type VersionInfo = { version: string; commit: string };` and `export async function getVersionInfo(): Promise<VersionInfo>` that fetches `${API_BASE_URL}/api/version`, throws `Loading the version failed: {status} {statusText}` on a non-OK response, and throws `Unexpected version response` when the parsed body's `commit` is not a string (an unexpected shape, `coding_standards.md` Section 4).
  - `frontend/src/components/AppFooter.tsx`: add `const SHORT_COMMIT_LENGTH = 7;`, `const [commit, setCommit] = useState<string | null>(null);` and a `useEffect` (empty deps) calling `getVersionInfo()`; on success set `commit` to `info.commit.trim().slice(0, SHORT_COMMIT_LENGTH)` or `null` when that is empty; on rejection set nothing (stays `null`); guard both with an `isMounted` flag cleared in the cleanup. Render: the existing text (`Task Notes v{trimmedVersion}` or `Task Notes`), followed by ` ({commit})` only when `commit` is non-null. The `<footer data-testid="app-footer" style={footerStyle}>` element, `APP_NAME`, `footerStyle` and the `version` prop stay as they are. The commit is wrapped in `<span data-testid="app-footer-commit">` so tests can target it.
  - `frontend/src/components/LandingPage.tsx`: unchanged.
- Routes: none (landing page at `/`, unchanged).
- State management: local `useState` in `AppFooter`; no context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit sits inline in the existing footer and inherits its values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. No new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-09; consumed, not changed)
- Request: no body, no parameters.
- Response: 200, `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `"unknown"` when the backend has no `BUILD_COMMIT`.
- Client contract: `getVersionInfo(): Promise<VersionInfo>` resolves with the body; rejects on a network error, a non-OK status, or a body whose `commit` is not a string.
- Rendered footer text: success `Task Notes v{packageVersion} ({first 7 of commit})`, e.g. `Task Notes v0.0.0 (0123456)`; pending or failure `Task Notes v{packageVersion}`, e.g. `Task Notes v0.0.0`. The footer's `version` stays the frontend package version from TEST-08; the response's `version` field is not displayed.

## Technology Selection
- Version client `frontend/src/api/version.ts`: chose the browser's native `fetch`, as `notes.ts` already does, over adding a data-fetching library (none is installed), because one GET needs a few lines.
- Shared base URL `frontend/src/api/apiBaseUrl.ts`: chose a plain module constant over a config library or Vite `define`, because the value is already read from `import.meta.env` and only needs one home.
- Pending and failure handling: chose React's built-in `useState` and `useEffect` over a suspense or query library, because the only states are "no commit yet" and "commit"; no installed dependency is needed.
- 7-character short commit: chose `String.prototype.slice(0, 7)` over any helper; no alternative is warranted.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single declaration of `API_BASE_URL` (moved from notes.ts)
- [A] frontend/src/api/version.ts: `VersionInfo` type and `getVersionInfo()` client for `GET /api/version`
- [A] frontend/src/api/version.test.ts: client tests with `fetch` stubbed: OK body, non-OK status, non-string `commit`
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for the commit on the landing page, plus the failed-request edge case
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the failed-request edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: fetch the commit on mount and append its first 7 characters; version alone while pending or on failure
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; success, pending and failure tests; existing tests run with a pending mock
- [A] frontend/src/components/LandingPage.test.tsx: add a `vi.mock` of `../api/version` (pending promise) so the page test makes no real request

`frontend/src/components/LandingPage.tsx` is not modified: the footer does its own fetch.
No dependency changes, so no lockfile entry.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (`VITE_API_BASE_URL` keeps its existing meaning and default).

## Testing Strategy
- Unit tests (Vitest, colocated `{name}.test.ts(x)` beside the source, matching the existing frontend convention; `backend/tests/unit/` in CLAUDE.md is the backend's):
  - `frontend/src/components/AppFooter.test.tsx`, with `vi.mock("../api/version", ...)` and `vi.mocked(getVersionInfo)` reset in `beforeEach`, defaulting to a never-settling promise:
    - success: mock resolves `{ version: "9.9.9", commit: "0123456789ab" }`, render `<AppFooter version="1.2.3" />` → `findByTestId("app-footer-commit")` has text `0123456` and the footer reads exactly `Task Notes v1.2.3 (0123456)` (the response `version` is not shown).
    - pending: mock returns a never-settling promise → footer reads exactly `Task Notes v1.2.3`, no `app-footer-commit` element, text contains neither `undefined` nor `(`.
    - failure: mock rejects with `new Error("Loading the version failed: 500 Internal Server Error")` → after `waitFor(() => expect(getVersionInfoMock).toHaveBeenCalledTimes(1))` and a settled microtask, footer reads exactly `Task Notes v1.2.3`, no error text, no `undefined`.
    - edge: mock resolves `commit: "   "` → footer reads exactly `Task Notes v1.2.3`; mock resolves `commit: "abc"` → `Task Notes v1.2.3 (abc)`.
    - the five existing tests stay and pass against the pending default.
  - `frontend/src/api/version.test.ts`, stubbing `fetch` as `notes.test.ts` does: resolves the body from `http://localhost:8010/api/version`; rejects with `Loading the version failed: 503 Service Unavailable` on a non-OK response; rejects with `Unexpected version response` when `commit` is a number.
  - `frontend/src/api/notes.test.ts` is unchanged and must stay green (it covers the moved base-URL default and the `VITE_API_BASE_URL` override through `vi.resetModules`).
  - `frontend/src/components/LandingPage.test.tsx`: existing tests unchanged in behaviour, with the version client mocked to a pending promise.
  - Directory: frontend/src/ (colocated)
  - Naming: `{Module}.test.ts` / `{Component}.test.tsx`
- Integration tests: none warranted: no repository, model, migration or endpoint change (`testing_standards.md` Section 6); TEST-09's integration tests already cover `GET /api/version`.
  - Directory: backend/tests/integration/ (no file for this item)
- E2E tests: criterion 1, in the browser against the running stack. The spec reads the expected commit with Playwright's `request` fixture from `GET {VITE_API_BASE_URL or http://localhost:8010}/api/version` in setup, opens `/`, and asserts `getByTestId("app-footer-commit")` has text equal to the first 7 characters of that commit and the footer contains `v{frontend/package.json version}`. Edge-case spec: `page.route("**/api/version", ...)` fulfils with status 500, opens `/`, asserts the footer text is exactly `Task Notes v{version}` and contains no `undefined`. Existing `e2e/tests/TEST-04_page_footer.spec.ts` must stay green unchanged.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one Gherkin scenario per criterion plus the failed-request edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | Verifying it needs no navigation or interaction: it is a rendering rule over the client's promise state, and the pending state cannot be held open in a browser deterministically; the E2E edge spec also exercises the failure path. |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion itself names the component-test tier. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows first 7 characters of the commit next to the version | Read the commit from `GET /api/version` in setup, open `/`, assert `app-footer-commit` equals its first 7 characters and the footer contains `v{package version}` | Given the stack is running with BUILD_COMMIT set to a 40-character sha, When I open the landing page, Then the footer reads "Task Notes v0.0.0 (" followed by the sha's first 7 characters and ")" |
| 2 | Version alone while pending or on failure | covered at Unit, see Criterion coverage; E2E edge spec routes `/api/version` to 500 | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes v0.0.0" with no "undefined" and no error |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the AppFooter test file, When the frontend tests run, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: from the repository root, start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`; the frontend is at http://localhost:5183 and the backend at http://localhost:8010; `frontend/package.json` declares `"version": "0.0.0"`.
1. Run `curl -s http://localhost:8010/api/version` → the body contains `"commit": "0123456789ab"`.
2. Open http://localhost:5183/ in a browser → the landing page shows the "Task Notes" heading, the note form and the note list.
3. Scroll to the bottom of the page → the grey footer line reads `Task Notes v0.0.0 (0123456)`: the version first, then the first 7 characters of the commit in parentheses.
4. Restart the backend without a commit: `docker compose up -d backend` with `BUILD_COMMIT` unset in your shell, then reload http://localhost:5183/ → the footer reads `Task Notes v0.0.0 (unknown)`, the backend's own value.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone
Prerequisites: the stack is running as in Criterion 1.
1. Stop the backend: `docker compose stop backend`.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.0.0`; it shows no `undefined`, no `null`, no empty parentheses and no error message, and the rest of the page still renders.
3. Open the browser dev tools Network tab, set throttling to "Slow 3G", start the backend with `docker compose start backend`, and reload → while the `/api/version` request is still in flight the footer reads `Task Notes v0.0.0`; once it completes the footer changes to `Task Notes v0.0.0 (unknown)` (or the 7-character commit if `BUILD_COMMIT` is set).
4. Set throttling back to "No throttling".

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Open `frontend/src/components/AppFooter.test.tsx` → it mocks `../api/version` and has a success test expecting `Task Notes v1.2.3 (0123456)`, a pending test expecting exactly `Task Notes v1.2.3`, and a failure test expecting exactly `Task Notes v1.2.3`.
2. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/api/notes.test.ts src/components/LandingPage.test.tsx` → `0 failed`.
