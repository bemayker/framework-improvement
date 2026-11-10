# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> TEST-10: Footer shows the build commit
>
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
- Comment (tracker): the dispatching session read the item's comments and relayed "none actionable (all framework PR notices)" → not acted on because none states a requirement.
- Assumption (criterion 2 against the code on main, recorded instead of a blocking question per `user_story_alignment.md` Section 4): the item was written when the footer's version was imagined as independent of the request, but on main (f2d4e6f) TEST-08's footer gets its version from the same `GET /api/version` call that carries the commit, and its pending and failure states render exactly `Task Notes` with no version. "The version alone" is therefore read as "what the footer shows without a commit": `Task Notes` while pending or on failure (TEST-08's existing behaviour, unchanged), and `Task Notes v{version}` when the version resolves but no usable commit does. No commit text, no `undefined`, no `null`, no `unknown` and no error text ever appears.
- Assumption: TEST-09 answers `commit: "unknown"` when `BUILD_COMMIT` is unset or blank (`backend/app/core/config.py` `UNKNOWN_BUILD_COMMIT`). That literal means "no commit", exactly like the version sentinel the client already rejects, so the footer treats it, and a missing, non-string or empty `commit`, as no commit and shows the version alone. A missing commit does not fail the version: the version keeps rendering.
- Assumption (presentation, no design reference): the short commit renders in parentheses after the version, `Task Notes v0.1.0 (0123456)`, in its own `<span data-testid="app-footer-commit">`, inheriting the footer's style. No link to the repository, no tooltip, no copy button (not asked for, `user_story_alignment.md` Section 3).
- Assumption: the 7-character cut happens in the footer, not in the backend (TEST-09 serves 12 characters and is not changed; the item is frontend only).
- Merged since the last plan: n/a (fresh plan, branched from current main f2d4e6f).

## Plan Overview
Frontend-only change to TEST-08's footer and its API client:
- `frontend/src/api/version.ts`: `getBackendVersion(): Promise<string>` becomes `getBackendBuildInfo(): Promise<BuildInfo>` with `BuildInfo = { version: string; commit: string | null }`. Same single fetch of `GET /api/version`, same rejection rules for the version (network failure, non-2xx, missing/empty/non-string version, the `unknown` sentinel). The commit is normalised: a non-empty string other than `unknown` is returned as served, anything else is `null`. One request still feeds both values, so the footer never makes a second call.
- `frontend/src/components/AppFooter.tsx`: state becomes `BuildInfo | null`; renders `Task Notes`, then ` v{version}` once resolved, then ` ({first 7 chars of commit})` when the commit is not null.
- Tests: `version.test.ts` and `AppFooter.test.tsx` updated and extended; `LandingPage.test.tsx`'s mock of `../api/version` follows the rename.
- `LandingPage.tsx`, every backend file and every E2E spec stay unchanged. TEST-08's existing E2E spec keeps passing because the E2E and CI stacks run without `BUILD_COMMIT` (backend answers `unknown`, so no commit renders).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modified):
    - `VersionResponse` gains `commit: string`.
    - New exported type `BuildInfo = { version: string; commit: string | null }`.
    - Rename the existing `UNKNOWN_VERSION_SENTINEL` to `UNKNOWN_SENTINEL` (same literal `"unknown"`, comment updated to cite both `UNKNOWN_VERSION` in `version_service.py` and `UNKNOWN_BUILD_COMMIT` in `config.py`).
    - `getBackendVersion` renamed to `getBackendBuildInfo`, returning `{ version, commit }`; version checks and error messages unchanged; `commit` is `body.commit` when `typeof body.commit === "string" && body.commit !== "" && body.commit !== UNKNOWN_SENTINEL`, else `null`. Docstring updated.
  - `frontend/src/components/AppFooter.tsx` (modified):
    - Import `getBackendBuildInfo` and `type BuildInfo`; `const SHORT_COMMIT_LENGTH = 7;`.
    - `const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);` with the same mount-once effect, `isMounted` guard and silent `.catch`.
    - Render: `{APP_NAME}`, then when `buildInfo !== null` the existing `<span data-testid="app-footer-version"> v{buildInfo.version}</span>`, then when `buildInfo?.commit` is a string `<span data-testid="app-footer-commit"> ({buildInfo.commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter`, unchanged shape apart from the value type; no props.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer values unchanged from TEST-08: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. The commit span carries no style of its own and inherits those values; text shape `Task Notes v{version} ({7-char commit})`, one space before the opening parenthesis.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing endpoint from TEST-05, `commit` added by TEST-09; consumed unchanged, on `API_BASE_URL` from `frontend/src/api/baseUrl.ts`)
- Request: none
- Response: 200 `{"version": "0.1.0", "commit": "0123456789ab"}`; with `BUILD_COMMIT` unset `{"version": "0.1.0", "commit": "unknown"}`
- Client contract (new): `getBackendBuildInfo()` resolves `{"version": "0.1.0", "commit": "0123456789ab"}` or `{"version": "0.1.0", "commit": null}`, and rejects in every case `getBackendVersion` rejected in before.

## Technology Selection
- Short commit: chose the standard library's `String.prototype.slice(0, 7)` over a formatting helper or dependency, because a slice is the whole need.
- Build info client: chose extending the existing `frontend/src/api/version.ts` client and the platform `fetch` it already uses over a second client function or a data-fetching library (react-query or similar, not installed), because one request already carries both values and a second fetch would double the call.
- No new component, module or dependency is added, so no lockfile changes.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the unknown-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: rename to getBackendBuildInfo, add the BuildInfo type and the commit normalisation (unknown, missing, empty or non-string commit becomes null)
- [A] frontend/src/api/version.test.ts: follow the rename; add commit returned as served, commit unknown/missing/empty/non-string becomes null without rejecting, version rejections unchanged
- [A] frontend/src/components/AppFooter.tsx: hold BuildInfo, render the 7-character commit span after the version when a commit is present
- [A] frontend/src/components/AppFooter.test.tsx: follow the rename; add success with commit, success with null commit, pending and failure paths asserting no commit and no undefined/null/unknown text
- [A] frontend/src/components/LandingPage.test.tsx: mock getBackendBuildInfo instead of getBackendVersion so the page tests keep rendering the footer

Neither README.md nor docs/DEVELOPMENT.md needs an edit: this item changes no project structure, run configuration, dependency or test infrastructure. No lockfile changes: no dependency is added or removed.

## Testing Strategy
- Unit tests (Vitest, co-located `{Module}.test.ts(x)` next to the module, the frontend's existing convention; the configured `backend/tests/unit/` directory is the backend's and no backend test changes):
  - `frontend/src/api/version.test.ts`: existing cases renamed to `getBackendBuildInfo`; `resolves the version and the commit from the response body` (`{"version": "0.1.0", "commit": "0123456789ab"}` resolves both as served); `it.each` for commit `"unknown"`, missing, `""`, `3` and `null` resolving `commit: null` with the version intact; every existing rejection case unchanged.
  - `frontend/src/components/AppFooter.test.tsx`, mocking `getBackendBuildInfo`:
    - success: resolves `{ version: "9.9.9", commit: "0123456789ab" }` → footer text exactly `Task Notes v9.9.9 (0123456)`, `app-footer-commit` present with ` (0123456)`.
    - success without commit: resolves `{ version: "9.9.9", commit: null }` → exactly `Task Notes v9.9.9`, no `app-footer-commit`.
    - pending: never-resolving promise → exactly `Task Notes`, no version and no commit element.
    - failure: rejected promise → exactly `Task Notes`, no version and no commit element, and the text contains none of `undefined`, `null`, `unknown`, `(`.
    - the existing sentinel-rejection, request-once and contentinfo tests kept, following the rename.
  - `frontend/src/components/LandingPage.test.tsx`: mock renamed and resolving `{ version: "9.9.9", commit: null }`; existing assertions unchanged.
- Integration tests: no new integration test; no router, service or repository change, and `GET /api/version`'s `commit` is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: no new spec, because no criterion's covering tier is E2E (Criterion coverage below): the footer renders on page load with no navigation or interaction. The existing `e2e/tests/TEST-08_footer_app_version.spec.ts` stays unchanged and keeps exercising the footer in the browser against the real endpoint; it stays green because the E2E and CI stacks start without `BUILD_COMMIT`, so the backend answers `commit: "unknown"` and no commit renders.
  - Directory: `e2e/tests/`
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the unknown-commit edge case.
  - Directory: `e2e/uat/scenarios/` (Gherkin) and `e2e/uat/scripts/` (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | Unit | verifying it needs no navigation or interaction: the footer renders on load; the response parsing is asserted in version.test.ts and the rendered text in AppFooter.test.tsx, and the browser path to the real endpoint is already exercised by TEST-08's spec |
| 2 | While pending or on failure the footer shows the version alone, never undefined or an error | Unit | verifying it needs no navigation or interaction: pending and failure are only deterministic with a controlled promise in AppFooter.test.tsx; the unknown-commit fallback is asserted in version.test.ts and AppFooter.test.tsx, and the aborted-request case is already a browser test in TEST-08's spec |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself the component test: AppFooter.test.tsx |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 0123456789abcdef When I open the landing page Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows no commit and no error | covered at Unit, see Criterion coverage | Given the version request is blocked When I open the landing page Then the footer reads "Task Notes" and contains no "undefined" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run AppFooter.test.tsx Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the 7-character commit next to the version
Prerequisites: Docker running; from the repository root, the stack started with a known commit: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
1. In a terminal run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and the note list.
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in parentheses, right after the version, in the same small grey text as the rest of the footer.

### Criterion 2: While pending or on failure, the footer shows no commit and no error
Prerequisites: the stack from criterion 1 is running; the browser is Chrome with DevTools available.
1. On `http://localhost:5183/`, open DevTools → Network, set throttling to `Slow 3G` and reload → while the `version` request is still pending the footer reads exactly `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (0123456)`. At no point does it show `undefined`, `null` or an error message.
2. In DevTools → Network, right-click the `version` request and choose "Block request URL", set throttling back to `No throttling`, and reload → the footer reads exactly `Task Notes`, with no version, no commit and no error text.
3. Unblock the URL (DevTools → Network request blocking → remove `http://localhost:8010/api/version`), then in a terminal at the repository root run `docker compose up -d --build backend` with no `BUILD_COMMIT` set, and reload the page → `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"unknown"}` and the footer reads exactly `Task Notes v0.1.0`, with no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, running `AppFooter.test.tsx` (success with commit, success without commit, pending, failure, sentinel rejection, request once, contentinfo landmark) and `version.test.ts`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains one test each for the success path (footer `Task Notes v9.9.9 (0123456)`), the pending path and the failure path (footer exactly `Task Notes`).
