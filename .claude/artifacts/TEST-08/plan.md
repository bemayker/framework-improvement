# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Correction (tracker comment, overrides the description where they disagree):** the version must come from the backend at runtime, not from package.json at build time. The footer fetches GET /api/version; a frontend rebuilt against an older backend must show the backend version. The loading and failure states must be decided and recorded, and the backend dependency must be stated in the plan.

## Acceptance Criteria
<!-- Criteria 2 and 3 are amended by the human correction comment (see Re-Plan Feedback); the comment overrides the description where the two disagree. -->
- [ ] 1. The footer renders the version string on the landing page: the version the backend reports at runtime.
- [ ] 2. The version comes from a single declared source, the backend GET /api/version response read at runtime, never from the frontend package.json and never a string typed into the component; a frontend served against an older backend shows the backend version, not its own.
- [ ] 3. While /api/version has not resolved, and when the version cannot be resolved (backend unreachable, non-2xx response, malformed body, empty string, or the backend sentinel `unknown`), the footer renders the app name alone, never `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, operator, 2026-09-07): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts a9695cc (with 8794a99 and ffbfc12) on the sandbox main ... reverting restores TEST-04's footer assertion as it was." Addressed by: checked main at 46f9dbd before planning. The revert has landed (sandbox reset c21ade6 removed the earlier TEST-08 and TEST-10 work, commits 6e0d841 and 4e7bd3e). Found: `frontend/src/components/AppFooter.tsx` still imports `version` from `frontend/package.json` (TEST-04 behaviour) and fetches nothing; `frontend/src/api/version.ts` does not exist (only `notes.ts` is in `frontend/src/api/`); `AppFooter.test.tsx`, `LandingPage.test.tsx` and `e2e/tests/TEST-04_page_footer.spec.ts` all assert the frontend package.json version (TEST-04 assertions restored as the comment says). GET /api/version exists on the backend (TEST-05). So the whole frontend half is missing and is built here; nothing is duplicated.
- Comment (tracker, human correction): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend version, and have the footer fetch it ..." Addressed by: criteria 2 and 3 amended above; the footer fetches GET /api/version through a new client module `frontend/src/api/version.ts`. The endpoint itself is NOT added: it already exists on main (`backend/app/routers/version.py`, TEST-05, response field `version`, backend `pyproject.toml` version 0.1.0 vs frontend package.json 0.0.0, so the two sources are distinguishable).
- Comment (tracker, human correction), loading state: "Decide and record what it shows before the fetch resolves." Addressed by: DECISION, before the fetch resolves the footer renders the app name alone, `Task Notes`, with no version element, no placeholder text and no dangling `v`. Chosen over a `loading` or ellipsis placeholder because the fetch is one small GET on mount and a placeholder would flash; the app name keeps the footer from collapsing, so there is no empty gap.
- Comment (tracker, human correction), failure state: "Decide and record what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded." Addressed by: DECISION, the footer renders the app name alone, `Task Notes` (the version part blank, the footer itself never blank), NOT `unknown`. The same applies to a non-2xx response, a malformed body, an empty string and the backend own `unknown` sentinel (`version_service.UNKNOWN_VERSION`, returned when package metadata is missing). Reason: acceptance criterion 3 says the footer renders without the version when it cannot be resolved, and `unknown` is a sentinel, not a version, so showing it would display a non-version as if it were one. The loading and failure states are deliberately the same DOM, so a stalled request and a failed one look identical; that is accepted for this item.
- Comment (tracker, human correction), backend scope: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." Addressed by: stated here and in Plan Overview and Backend Plan. The feature now DEPENDS on the backend (runtime GET /api/version, a dependency already recorded in feature_map.md as TEST-05) but CHANGES no backend file, because the endpoint the correction asks for already shipped with TEST-05. The File Manifest therefore carries no `[B]` entry, by design and not by omission. Dispatch note: TEST-09 (PR 227, in flight) extends the same endpoint with a `commit` field; that change is additive and TEST-08 reads `version` only, so TEST-08 keeps clear of every backend version file.
- Merged since the last plan: n/a (fresh plan, the item has no plan on main; planned against main at 46f9dbd as it now stands).

## Plan Overview
Frontend only in what it changes; it newly depends on the backend at runtime. The landing page footer (`AppFooter`) stops importing `frontend/package.json` and instead fetches the backend version from the existing GET /api/version endpoint (TEST-05) through a new typed client module, `frontend/src/api/version.ts`, alongside the existing `notes.ts` client. The footer owns that fetch itself, so `LandingPage.tsx` is NOT modified (keeping the shared-risk file with BUG-04 and TEST-10 untouched); only its test changes, to mock the new client. The API base URL, today a private constant in `notes.ts`, moves into one small `frontend/src/api/config.ts` both clients import, so the base URL keeps one source (`coding_standards.md` Section 5). Tests: Vitest unit tests for the client and the footer (both paths), a new Playwright spec that checks the footer against the real backend plus an unreachable-endpoint edge case, and the TEST-04 spec updated, since its frontend package.json assertion is exactly what this item replaces.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, resolved exactly as `notes.ts` resolves it today: `import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010`. One value, one source.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` instead of declaring it; behaviour unchanged (the existing `notes.test.ts` default-URL and `vi.stubEnv` plus `vi.resetModules` cases keep passing unchanged, because the re-imported module re-evaluates `config.ts` too).
  - `frontend/src/api/version.ts` (new): `fetchAppVersion(): Promise<string | null>`. GETs the API base URL plus `/api/version`. Returns the trimmed `version` string when the response is 2xx and the body carries a non-empty string `version` that is not the backend sentinel `unknown`; returns `null` for a non-2xx response, a body without a string `version`, an empty string or `unknown`. A network error (fetch rejects) propagates as a rejection, as `notes.ts` does; the component absorbs it. Exports the sentinel as a named constant (`UNKNOWN_VERSION = "unknown"`) with a comment saying why it mirrors `backend/app/services/version_service.py`. No retry and no timeout: neither is asked for (a timeout is CHORE-02 scope).
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `version: string | null` in state, initial `null`; a mount-only `useEffect` calls `fetchAppVersion()`, sets the result, and on rejection sets `null`, with the same `isMounted` guard `LandingPage.tsx` uses. Render `Task Notes` always; render the version as `<span data-testid="app-footer-version"> v0.1.0</span>` (a leading space, then `v`, then the value) only when `version` is a non-null string, so the absent path leaves no element, no space and no `v`. The footer keeps `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and its existing style object unchanged.
  - `frontend/src/components/LandingPage.tsx`: NOT modified. The footer is self-contained, so the page keeps rendering `<AppFooter />` as it does now.
- Routes: none new.
- State management: local component state in `AppFooter` (`useState` plus `useEffect`), no global store, fetched once per mount.
- Loading state (recorded decision, see Re-Plan Feedback): footer text is `Task Notes` with no `app-footer-version` element.
- Failure state (recorded decision, see Re-Plan Feedback): identical to the loading state, `Task Notes` with no `app-footer-version` element; never `unknown`, `undefined`, `null` or an empty gap.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps the TEST-04 style values already in the code, unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required.

The feature depends at runtime on the existing GET /api/version endpoint (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, all from TEST-05) and on the existing CORS configuration that already lets the browser origin call `/api/notes` with GET. No backend file is created or edited: TEST-09 (in flight, PR 227) owns the backend version files and adds a `commit` field, which this item ignores.

## API Integration Plan
No external API integration.

## API Contract
<!-- Internal API consumed, not changed. Defined by TEST-05; TEST-09 adds a commit field additively, which TEST-08 does not read. -->
- Method: GET
- URL: `/api/version` (on the API base URL, default `http://localhost:8010`)
- Request: no body, no query parameters, no headers beyond the browser defaults.
- Response: 200 with a JSON body whose `version` field is a string (backend `pyproject.toml` version, `0.1.0` today, or the sentinel `unknown` when package metadata is missing). Example:

```json
{"version": "0.1.0"}
```
- Consumer handling: 2xx with a non-empty string version that is not unknown renders the version; anything else renders the app name alone.

## Technology Selection
- Version source: chose a runtime GET to the existing backend /api/version over the frontend `package.json` import and over a Vite build-time `define` variable, because the human correction requires the backend version at runtime; both alternatives are build-time and would show the frontend own version against an older backend.
- `frontend/src/api/version.ts` (HTTP client): chose the platform `fetch` (already the pattern in `notes.ts`) over adding axios or a data-fetching library such as React Query or SWR, because one GET on mount needs nothing those add.
- Response validation: chose a `typeof` string check in the client over adding a schema library such as zod, because the body has one field.
- Loading and failure state in `AppFooter`: chose React `useState` plus `useEffect`, already installed and already the pattern in `LandingPage.tsx`, over a new state or suspense library.
- `frontend/src/api/config.ts`: no stdlib call, native platform feature or installed dependency covers sharing one constant between two modules, so it is a three-line module built here; chosen over duplicating the base URL default in `version.ts`, which would give one deployment-dependent value two sources.
- Tests: Vitest, Testing Library and Playwright are already installed; no new test dependency. No dependency is added at all, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source of the API base URL (VITE_API_BASE_URL with the documented default), imported by both API clients
- [A] frontend/src/api/version.ts: typed client for GET /api/version, returning the backend version or null when it cannot be resolved
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client with fetch stubbed (2xx version, configured base URL, non-2xx, malformed body, empty string, unknown sentinel, network rejection)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the backend version on the landing page, plus the unreachable-endpoint edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./config instead of declaring it locally; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the version on mount via fetchAppVersion; render the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert the version-present path and the version-absent paths (null, rejection, before resolution); drop the package.json assertion
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version so the footer fetch is deterministic; replace the package.json version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the frontend/package.json version expectation with the backend version read from backend/pyproject.toml, since TEST-08 supersedes the TEST-04 version source; the name and landmark checks stay

No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, so no [Docs] entry. `frontend/src/components/LandingPage.tsx`, `frontend/src/components/NoteForm.tsx` and every backend file are deliberately absent (shared risk with BUG-04, TEST-09 and TEST-10). The TEST-04 UAT scenario and manual script (e2e/uat/) still describe the package.json source; they are TEST-04 historic artifacts, validated for well-formedness only, and are left unchanged to keep this item small.

## Testing Strategy
- Unit tests (Vitest, frontend):
  - `frontend/src/api/version.test.ts`: stub the global fetch (the `notes.test.ts` pattern). Cases: 2xx with version 0.1.0 returns 0.1.0 from the default base URL; a configured VITE_API_BASE_URL is used (stubEnv plus resetModules plus dynamic import); non-2xx (503) returns null; a body without a string version returns null; an empty string returns null; the unknown sentinel returns null; a rejected fetch rejects.
  - `frontend/src/components/AppFooter.test.tsx`: mock `../api/version`. Version present: client resolves 0.1.0, the footer shows `Task Notes v0.1.0` and the `app-footer-version` element. Version absent: client resolves null, and separately rejects; the footer text is exactly `Task Notes`, no `app-footer-version` element, and the text contains none of `undefined`, `null`, `unknown`. Before resolution: with a never-settling promise, the footer reads exactly `Task Notes`. Keep the contentinfo landmark and test-id test.
  - `frontend/src/components/LandingPage.test.tsx`: mock `../api/version` resolving a fixed version; the footer test asserts that mocked version instead of package.json.
  - Directory: co-located with the source under `frontend/src/` (existing frontend convention; `backend/tests/unit/` is the backend directory and is not touched).
  - Naming: `{module}.test.ts(x)`, the existing frontend convention.
- Integration tests: enabled, but not warranted for this item: it adds or modifies no endpoint, repository or model (testing_standards.md Section 6), and GET /api/version is already covered by the TEST-05 backend tests.
  - Directory: backend/tests/integration/ (no file added)
- E2E tests (Playwright, against the running stack):
  - `e2e/tests/TEST-08_footer_app_version.spec.ts`: (a) on `/`, the `app-footer-version` element is visible and contains the version read from `backend/pyproject.toml` (parsed with node fs, the TEST-04 spec pattern), and the footer contains `Task Notes`; (b) edge case: with `page.route` aborting requests to `**/api/version` before `page.goto`, the footer is visible, has text exactly `Task Notes`, and the `app-footer-version` element has count 0.
  - `e2e/tests/TEST-04_page_footer.spec.ts`: its expected version becomes the backend version from `backend/pyproject.toml`, and its version checks target the footer after the fetch (Playwright auto-waiting `toContainText`, no fixed waits).
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (backend unreachable).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the backend version on the landing page | E2E | — |
| 2 | The version comes from the backend GET /api/version at runtime, never package.json or a literal | Unit | verifying it needs no navigation or interaction: it is which URL the client calls and that the footer renders what the client returns, asserted by version.test.ts and AppFooter.test.tsx (E2E for criterion 1 also shows the backend 0.1.0, not the frontend 0.0.0) |
| 3 | Before resolution and when unresolvable, the footer renders the app name alone | Unit | verifying it needs no navigation or interaction: it is a rendering branch on the client result (null, rejection, pending), asserted in AppFooter.test.tsx and version.test.ts; the E2E edge-case spec additionally exercises the unreachable path |
| 4 | A component test asserts version present and version absent | Unit | the criterion is itself a component test: AppFooter.test.tsx, run by npm --prefix frontend test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the backend version | Open `/`, expect `app-footer-version` to contain the backend/pyproject.toml version | Given the stack is running When I open the landing page Then the footer shows Task Notes followed by the backend version |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports a version different from the frontend package.json When I open the landing page Then the footer shows the backend version |
| 3 | No version shown before resolution or when unresolvable | covered at Unit, see Criterion coverage (edge-case E2E aborts /api/version) | Given the backend is unreachable When I open the landing page Then the footer reads Task Notes with no version, unknown, undefined or null |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run it Then the AppFooter version-present and version-absent tests pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the backend version on the landing page
Prerequisites: the stack is running with `docker compose up --build` from the repo root (frontend on http://localhost:5183, backend on http://localhost:8010); `backend/pyproject.toml` declares version 0.1.0.
1. Open http://localhost:8010/api/version in a browser tab. The JSON body shows the version field reading `0.1.0`.
2. Open http://localhost:5183/ in another tab. The landing page shows the heading Task Notes.
3. Scroll to the bottom of the page and read the footer. It reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend
Prerequisites: as for criterion 1; `frontend/package.json` declares version 0.0.0.
1. Open `frontend/package.json` and confirm its version field reads `0.0.0`.
2. Open http://localhost:5183/ and read the footer. It reads `Task Notes v0.1.0`, the backend version, and not `v0.0.0`.
3. Open the browser developer tools, Network tab, and reload http://localhost:5183/. A GET request to http://localhost:8010/api/version appears with status 200.
4. Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and for `package.json`. Neither appears in the file.

### Criterion 3: Before resolution and when unresolvable, the footer shows the app name alone
Prerequisites: as for criterion 1.
1. Stop the backend only: `docker compose stop backend`. The frontend container keeps running.
2. Open http://localhost:5183/ (hard reload). The page loads with the heading Task Notes.
3. Read the footer. It reads exactly `Task Notes`, with no `v`, no trailing space or gap, and none of the words unknown, undefined or null.
4. Restart the backend: `docker compose start backend`, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/. The footer reads `Task Notes v0.1.0` again.
5. Loading state: in developer tools, Network tab, set throttling to Slow 3G and reload http://localhost:5183/. Until the /api/version request completes the footer reads exactly `Task Notes`; when it completes, ` v0.1.0` appears after it.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repo root. The run includes `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` and reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx`. It contains a test where the mocked client resolves a version and the footer shows it, and tests where the client resolves null or rejects and the footer reads exactly `Task Notes`.
