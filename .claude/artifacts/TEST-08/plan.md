# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> **TEST-08: Footer shows the app version**
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Acceptance criteria:
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> Notes: Frontend only, under frontend/src/. Modifies LandingPage.tsx (TEST-04 also touched; complete). Depends on: TEST-04, TEST-05 (both done).

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the newest tracker comment:** that source is the backend, read at runtime from `GET /api/version` (whose value is the backend's `[project].version` resolved from installed package metadata by TEST-05's `version_service`), not `frontend/package.json` at build time.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. **Amended by the tracker comment:** the loading state and the failure state are decided explicitly (see Plan Overview).
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback (if applicable)
- Comment (tracker, newest, the operative correction): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint ... have the footer fetch it ... decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable ... This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Addressed by: the comment overrides the description's criterion 2 wording ("frontend package metadata or a build-time variable"). The footer now fetches `GET /api/version` at runtime through a new client module and shows the backend's `version`; `frontend/package.json` is no longer read by the footer at all, so a frontend rebuilt against an older backend shows the backend's version. **Backend change, stated explicitly:** the comment asks for a backend endpoint, which makes this no longer a frontend-only item in substance. That backend work **already exists on main**: `GET /api/version` was delivered by TEST-05 (`backend/app/routers/version.py`, `schemas/version.py`, `services/version_service.py`), and TEST-09 (PR #94) extends its body with a `commit` field. This plan therefore adds **no backend file** and duplicates nothing; the File Manifest carries no `[B]` entry and the Backend Plan says so with this reason. Loading and failure states: decided and recorded in Plan Overview, "Footer states".
- Comment (tracker, operational reset note): verify on main that no TEST-08 implementation exists → Addressed by: verified on main @ 4a5f447. `frontend/src/api/` holds only `notes.ts` and `notes.test.ts` (no `version.ts`); `frontend/src/components/AppFooter.tsx` still imports `version` from `../../package.json` and renders `Task Notes v{version}`; `git grep "api/version" -- frontend e2e` finds no frontend or E2E caller (only three UAT scripts of other items that open the endpoint by hand). The earlier TEST-08 merge (#68, bbb1cc5) was removed by the sandbox reset #83 (c4b94fe). No TEST-08 implementation is present; the earlier `.claude/artifacts/TEST-08/` holds only `.gitignore` and `stats.jsonl`.
- Comment (tracker, framework PR-link notices for #25, #38, #68): not actionable as links (that code was reset off main). Their recorded decisions are prior art and are **adopted**: loading shows `Task Notes` alone; failure is distinct and reads `Task Notes · version unavailable`; the backend's `"unknown"` sentinel (TEST-05 `UNKNOWN_VERSION`) is treated as "could not be resolved". Reason for adopting rather than deviating: they answer the comment's "blank vs unknown" question in the only way that keeps all three states distinguishable to a person, and the word `unknown` is deliberately avoided in the UI because it is the backend's own sentinel value and would read as a version.
- Dispatch note (current state, not a tracker comment): TEST-09 (PR #94) changes the response to carry `version` and `commit`. → Addressed by: the client reads only `version` and ignores every other field, so the plan works identically before and after TEST-09 merges; a client unit test feeds a body with an extra `commit` field. Showing `commit` is TEST-10's scope and is not done here.
- Assumption (item Notes say "Modifies LandingPage.tsx"): `frontend/src/components/LandingPage.tsx` is **not** modified. The fetch lives in `AppFooter`, which `LandingPage` already renders, so the page itself needs no change; only `LandingPage.test.tsx` changes, because it currently asserts the `package.json` version. This also removes the possible overlap with BUG-04 that `feature_map.md` flags.
- Assumption (TEST-04 artifacts): TEST-04's E2E spec, Gherkin feature and UAT script assert that the footer version equals `frontend/package.json`'s `version`. That statement becomes false by design under the comment, so those three files are updated to the new source; no TEST-04 behaviour other than the version source changes.

## Plan Overview
Frontend only in its diff: the existing `AppFooter` stops importing `frontend/package.json` and instead fetches the backend's version at runtime from the existing `GET /api/version` (TEST-05), through a new API client module, so the frontend never calls `fetch` from a component. The API base URL, today a private constant inside `api/notes.ts`, moves to one shared module so the notes client and the version client read the same value from one source (`coding_standards.md` Section 5: one value, one source). No backend change is needed because the endpoint already exists (see Re-Plan Feedback). Not a scaffold item.

**Footer states (the decision the tracker comment asks to be recorded):**
| State | When | Footer text (inside `data-testid="app-footer"`) |
|---|---|---|
| loading | before `GET /api/version` settles | `Task Notes` (name only; no version, no placeholder, no trailing `v` or separator) |
| ready | the response is OK and `version` is a non-blank string other than `unknown` | `Task Notes v{version}`, e.g. `Task Notes v0.1.0` |
| unavailable | network error, non-OK status, unparseable body, or `version` missing, non-string, blank or equal to the backend sentinel `unknown` | `Task Notes · version unavailable` |

Why: loading is name-only because it lasts milliseconds and a placeholder would flash; failure is distinct from loading because the comment's use case is a partial deploy, where a person must be able to tell "backend unreachable" from "still loading". The text never contains `undefined`, `null`, `unknown` or a dangling `v` (criterion 3). No retry and no polling: one fetch on mount (no gold plating). The version text is rendered in a child `<span data-testid="app-footer-version">` only in the ready state, so tests can assert its absence precisely.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, resolved once as `import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL` with `DEFAULT_API_BASE_URL = "http://localhost:8010"` (moved verbatim from `notes.ts`, with its comment).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` and delete its own two constants; behaviour unchanged (`notes.test.ts`'s `vi.resetModules()` + `vi.stubEnv` re-import still re-evaluates `config.ts`, so that test stays valid unchanged).
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string | null>`. Calls `fetch(` + "`${API_BASE_URL}/api/version`" + `)`; on `!response.ok` throws `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`'s `requestFailed`); parses JSON typed as `{ version?: unknown }`; returns the trimmed `version` when it is a non-blank string other than `UNKNOWN_BACKEND_VERSION = "unknown"`, otherwise `null`. Reads only `version`; any other field (TEST-09's `commit`) is ignored. A `null` means "the backend answered but could not resolve its version"; a throw means "could not reach or read the backend".
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; add `useState` for a status union `{ kind: "loading" } | { kind: "ready"; version: string } | { kind: "unavailable" }`; `useEffect` on mount calls `getBackendVersion()`, maps a string to ready and `null` or a rejection to unavailable, guarded by an `isMounted` flag exactly as `LandingPage` guards `listNotes`. Render per the Footer states table; keep `APP_NAME`, `footerStyle`, the `<footer>` element and `data-testid="app-footer"` unchanged. Constants `VERSION_UNAVAILABLE_TEXT = "version unavailable"` and the separator ` · ` live in the component as named constants (they are UI copy, not the version).
  - `frontend/src/components/LandingPage.tsx`: **not modified** (see Re-Plan Feedback assumption).
- Routes: none.
- State management: local component state in `AppFooter` (`useState` + `useEffect`), no context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept as is: `fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`; the unavailable text uses the same style (no new colour).

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns the backend's version from installed package metadata, with the sentinel `"unknown"` when the metadata is missing; TEST-09 (PR #94) adds `commit` to the same body. The tracker comment's backend requirement is therefore already satisfied by merged work, and this item adds and duplicates no backend file. CORS already admits the frontend origin (`backend/app/core/config.py` default `http://localhost:5183`, the same path `listNotes` uses).

## API Integration Plan
No external API integration. (The only call is to this project's own backend, through `frontend/src/api/version.ts`.)

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed, not changed)
- Request: no body, no parameters
- Response 200, before TEST-09: `{"version": "0.1.0"}`; after TEST-09: `{"version": "0.1.0", "commit": "abc123def456"}`. The client reads `version` only. `{"version": "unknown"}` (backend metadata missing) is treated as unresolved.
- Any non-2xx status or network error: treated as unavailable.

## Technology Selection
- Version fetch: chose the platform `fetch` API (as `api/notes.ts` already does) over adding a HTTP client library such as axios, because `fetch` covers a single GET with no new dependency.
- `frontend/src/api/version.ts`: no stdlib call, native platform feature or installed dependency is a client for this project's own endpoint, so it is built here (a few lines over `fetch`, following the existing `notes.ts` client pattern rather than calling `fetch` from the component).
- `frontend/src/api/config.ts`: chose a three-line module exporting the existing `import.meta.env.VITE_API_BASE_URL` fallback over duplicating the constant in `version.ts` or importing it from `notes.ts`, because Vite's native `import.meta.env` already supplies the value and the only need is one owner for it.
- Footer loading/failure state: chose React's built-in `useState`/`useEffect` (already installed) over a data-fetching library (react-query, SWR), because one fetch on mount needs no cache, retry or deduplication.
- Tests: chose the installed Vitest + Testing Library and Playwright's built-in `page.route` / `page.waitForResponse` over adding MSW or another mocking dependency.
- No new dependency, so no lockfile change.

## File Manifest
<!-- Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=- -->

### New files
- [A] frontend/src/api/config.ts: the one owner of `API_BASE_URL` (`VITE_API_BASE_URL` with the documented `http://localhost:8010` default), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`; returns the trimmed `version`, `null` when it is missing, non-string, blank or `unknown`, throws on a non-OK response; ignores every other field
- [A] frontend/src/api/version.test.ts: Vitest unit tests with `fetch` stubbed (as `notes.test.ts` does): calls `http://localhost:8010/api/version` by default; returns `0.1.0` from a body that also carries `commit`; returns `null` for a missing, blank, non-string and `unknown` version; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec; footer shows `v` + the `version` from the page's own `/api/version` response (read with `page.waitForResponse`); a `page.route` fulfilment of a 200 JSON body with version `9.9.9` and a `commit` field shows `Task Notes v9.9.9` (the backend's value wins, extra field ignored); edge case: `page.route` abort shows `Task Notes · version unavailable` and the footer text contains neither `undefined` nor `null`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the backend-unreachable edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` and drop its local `DEFAULT_API_BASE_URL` / `API_BASE_URL` constants; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount through `getBackendVersion()`; render the loading, ready and unavailable states per the Footer states table, the version inside `data-testid="app-footer-version"` only when ready
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the `package.json` test with: loading shows `Task Notes` and no `app-footer-version`; resolved `9.8.7` shows `Task Notes v9.8.7`; resolved `null` and rejected each show `Task Notes · version unavailable`, no `app-footer-version`, and text containing neither `undefined` nor `null`; keep the name and contentinfo-landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` (resolving `9.8.7`) alongside `../api/notes`; drop the `package.json` import; the footer test asserts `Task Notes v9.8.7` via `findByText`/`findByTestId` so the async state settles inside `act`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: the expected version is now the `version` in the page's own `/api/version` response (via `page.waitForResponse`) instead of `frontend/package.json`; the landmark, heading/subtitle and mobile tests are otherwise unchanged
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step "that version number matches the "version" field of frontend/package.json" becomes "matches the version reported by GET /api/version"
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to `http://localhost:8010/api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure (the footer is not documented in either, and `VITE_API_BASE_URL` keeps its name and default). `frontend/src/components/LandingPage.tsx` is deliberately absent: it renders `<AppFooter />` already and needs no change.

## Testing Strategy
- Unit tests: Vitest (frontend). `version.test.ts` covers the client: URL, extra-field tolerance, every unresolved shape (missing, blank, non-string, `unknown`) and the non-OK throw. `AppFooter.test.tsx` covers the three render states and both criterion-4 paths. `LandingPage.test.tsx` keeps the page-level footer assertion green against the mocked client. `notes.test.ts` stays unchanged and must still pass (it guards the `config.ts` move, including the `VITE_API_BASE_URL` override test).
  - Directory: colocated `frontend/src/**` `*.test.ts(x)`, the existing frontend convention (CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing files
- Integration tests: enabled per CLAUDE.md, but no backend code changes, so no new integration test is warranted (`testing_standards.md` Section 6: no repository, model, migration or router change). The endpoint's own integration coverage is TEST-05's `backend/tests/integration/test_version_integration.py`, unchanged.
- E2E tests: one spec for criterion 1 plus the edge-case spec (backend unreachable), and the backend-value-wins check; TEST-04's spec re-pointed at the new source. CI runs E2E against the full compose stack, so the real backend answers.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the backend-unreachable edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (the backend, at runtime), never a string typed into the component | Unit | verifying it needs no navigation or interaction: it is a property of where the value comes from, shown by the client test asserting the call to `/api/version` and the footer test rendering whatever arbitrary value (`9.8.7`) the client returns; the E2E `9.9.9` fulfilment check corroborates it in the browser |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | verifying it needs no navigation or interaction: it is a render branch on the client's result (`null` or rejection), exercised in jsdom; the E2E abort spec is the feature's required edge-case spec on top |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test (`AppFooter.test.tsx`), so a browser run cannot be its covering tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Go to `/`, read the page's `/api/version` response, assert `app-footer` contains `Task Notes v{version}` | Given the app is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Single declared source (backend) | covered at Unit, see Criterion coverage (E2E corroboration: fulfilled `9.9.9` shows `v9.9.9`) | Given the backend reports a version different from frontend/package.json, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version | covered at Unit, see Criterion coverage (E2E edge case: aborted `/api/version` shows `Task Notes · version unavailable`) | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes · version unavailable" with no "undefined" or "null" |
| 4 | Component test, both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the version-present and version-absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up -d` from the repository root), backend on `http://localhost:8010`, frontend on `http://localhost:5183`.
1. Open `http://localhost:8010/api/version` in a browser tab → a JSON body with a `version` value, e.g. `0.1.0` (and, once TEST-09 has merged, a `commit` value too). Note the `version`.
2. Open `http://localhost:5183/` → the landing page with the "Task Notes" heading, the note form and the note list.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v` followed by exactly the version noted in step 1, e.g. `Task Notes v0.1.0`, and shows nothing of the `commit` value.

### Criterion 2: The version comes from a single declared source, never a string typed into the component
Prerequisites: as Criterion 1; a terminal at the repository root.
1. Run `grep -n '"version"' frontend/package.json backend/pyproject.toml` → `frontend/package.json` shows `"version": "0.0.0"` and `backend/pyproject.toml` shows `version = "0.1.0"` (values at plan time; the point is that they differ).
2. Open `http://localhost:5183/` and read the footer → it shows the backend's value (`v0.1.0`), not the frontend's (`v0.0.0`): the footer reports the backend's version.
3. Run `grep -n "package.json\|0\.1\.0" frontend/src/components/AppFooter.tsx` → no output: the component neither imports the package metadata nor contains a typed version.
4. In the browser, open DevTools → Network, reload `http://localhost:5183/` → one request to `/api/version` with status 200; its response `version` is the value in the footer.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1; a terminal at the repository root.
1. Run `docker compose stop backend` → the backend container stops; `http://localhost:8010/api/version` no longer answers.
2. Open (or reload) `http://localhost:5183/` and read the footer → it reads exactly `Task Notes · version unavailable`; it contains no `undefined`, no `null`, no `unknown` and no lone `v`.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers again, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.
4. Loading state: in DevTools → Network set throttling to "Slow 3G", reload `http://localhost:5183/` and watch the footer → it first reads `Task Notes` alone (no version, no separator), then changes to `Task Notes v0.1.0` when the request completes. Reset throttling to "No throttling" afterwards.

### Criterion 4: A component test asserts both paths
This criterion is a test, not UI behaviour; the observable check is the test run.
1. From the repository root run `npm --prefix frontend test -- AppFooter` → the run passes and lists a test for the resolved-version path (`Task Notes v9.8.7`) and tests for the absent-version paths (`null` result and rejected request, each showing `Task Notes · version unavailable`).
