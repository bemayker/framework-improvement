# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
Criterion 2 is restated per the tracker comment (newest first, it overrides the description where they disagree); criterion 5 is the comment's own requirement, added so it gets a covering test and a manual check.

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's `GET /api/version` read at runtime (amended by the tracker comment; was "frontend package metadata or a build-time variable"), never a string typed into the component.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (Tracker comment) The footer shows the backend's version, never the frontend bundle's own `package.json` version, and its loading and failure states are the ones this plan records (Frontend Plan, "Footer states").

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the footer fetches `GET /api/version` on mount through a new client `frontend/src/api/version.ts`; the `package.json` import is removed from `AppFooter.tsx`; criterion 2 is restated and criterion 5 added. **The endpoint already exists on main**: TEST-05 (a declared dependency of this item, done) shipped `GET /api/version` returning `{"version": "<backend pyproject version>"}` in `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, covered by `backend/tests/integration/test_version_integration.py`. The plan therefore reuses it and adds no second endpoint.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The comment does change this item's backend **dependency** (the footer now needs a running backend, and the CORS-allowed origin must include the frontend's), but it requires **no backend file change**, because the endpoint it asks for was delivered by TEST-05. The File Manifest carries no `[B]` entry, deliberately. The description's "touches no backend file, genuinely parallel with TEST-07" claim still holds for files; it no longer holds at runtime, since the footer is now coupled to the backend's `/api/version` contract (and to TEST-09, which may extend that response; see Shared Risk Analysis).
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: recorded decision, Frontend Plan "Footer states". Loading: the footer shows the app name alone, `Task Notes`. Failure: the footer shows the app name alone, `Task Notes`. Neither state is blank (the footer element and app name are always rendered) and neither reads `unknown`. Reason: criterion 3, which the comment does not override, requires "renders without it" when the version cannot be resolved, and a placeholder such as `unknown` or `loading…` would put a non-version where a reader looks for one. Same-render for loading and failure is the chosen answer, not a default: a reader can only act on a real version, so the two states carry the same information for them. The backend's own sentinel `"unknown"` (what `version_service.get_app_version` returns when package metadata is missing) is treated as unresolved and also renders `Task Notes` alone. The frontend's `package.json` version is never used as a fallback, because that is exactly the misleading answer the comment rules out.
- Assumption (tracker comment, recorded rather than asked): the comment says "add a GET /api/version endpoint"; it exists already, with the response shape `{"version": string}`. The plan assumes that shape is what the comment wants and does not change it.
- Merged since the last plan: n/a (fresh plan on base 62be9fd76e4beeb5ec93d5fd3e9da1a35242d049; earlier TEST-08 builds #744 and #764 were reverted by the Arm E code resets #750 and #769, so main carries none of this item's work).

## Plan Overview
Frontend-only file changes. A typed API client `fetchBackendVersion()` calls the existing backend `GET /api/version` using the same `API_BASE_URL` the notes client already resolves (one value, one source). `AppFooter` fetches it once on mount and renders `Task Notes v{version}` when resolved, `Task Notes` alone while loading and on any failure. The `package.json` import leaves the component. Tests that asserted the frontend `package.json` version in the footer (`AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`) are updated to the backend source. `LandingPage.tsx` itself is **not** modified: `AppFooter` owns its own fetch, so the render site is unchanged.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`. Throws an `Error` (same `requestFailed`-style message as the notes client) on a non-OK status; network errors reject as `fetch` rejects them. Returns `null` when the body has no `version`, when it is not a string, when it is empty or whitespace, or when it equals the backend sentinel `"unknown"`. Typed response `type VersionResponse = { version: string }`. Reads only `version`, so an added field (TEST-09 may add one) is ignored.
  - `frontend/src/api/notes.ts` (modified): add `export` to the existing `API_BASE_URL` constant so the version client imports it rather than re-deriving the env lookup and the `http://localhost:8010` default. No behaviour change.
  - `frontend/src/components/AppFooter.tsx` (modified): remove `import { version } from "../../package.json"`; hold `backendVersion: string | null` in `useState(null)`; `useEffect` on mount calls `fetchBackendVersion()`, sets the value when resolved, leaves it `null` on rejection or `null`, with an `isMounted` guard as `LandingPage.tsx` already uses. Render `Task Notes` followed by ` v{backendVersion}` only when `backendVersion` is a non-empty string, so no trailing ` v`, space or empty element is emitted otherwise. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Footer states (the decision the tracker comment asks for):
  - Loading (request pending): text content exactly `Task Notes`.
  - Resolved: text content `Task Notes v{backend version}`, e.g. `Task Notes v0.1.0` against the current backend (`backend/pyproject.toml` version `0.1.0`).
  - Failure (network error, non-2xx, malformed body, empty version, or backend sentinel `unknown`): text content exactly `Task Notes`.
  - Never: `undefined`, `null`, `unknown`, `loading`, a dangling `v`, or the frontend `package.json` version (`0.0.0`).
- Routes: none.
- State management: local `useState` + `useEffect` in `AppFooter`; one request per mount, no retry, no polling (not asked for).
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing footer style is kept as-is: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version`, already exists on main from TEST-05 (`backend/app/routers/version.py`, registered in `backend/app/main.py`), returns `{"version": <backend pyproject.toml version>}`, needs no database, and is already allowed by the CORS middleware (GET from `settings.cors_origins`). This item depends on it at runtime; it edits no backend file. Stated explicitly per the tracker comment.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on the backend base URL `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: `200 {"version": "0.1.0"}` (existing TEST-05 contract; the value is the backend's installed package version, or the sentinel `"unknown"` when metadata is missing). Extra fields, if a later item adds them, are ignored by the client.

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the platform `fetch` over adding an HTTP library (none needed) and over `import.meta.env` / `package.json` at build time, because the comment requires the runtime backend value; the base URL reuses the existing `API_BASE_URL` from `frontend/src/api/notes.ts` rather than a second env lookup.
- Footer loading/failure state: chose React's built-in `useState`/`useEffect` (already installed) over a data-fetching library such as React Query, which this project does not install and one request does not warrant.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: typed client `fetchBackendVersion()` for `GET /api/version`, returns the version or `null` when unresolvable, throws on non-OK
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client (default base URL, non-OK throw, unusable body, `unknown` sentinel)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E specs for the backend version in the footer and the unreachable-endpoint path
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: export the existing `API_BASE_URL` constant (no behaviour change)
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render loading, resolved and failure states as recorded; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert resolved, pending, failed and sentinel paths; keep the landmark and app-name tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; footer test asserts the mocked backend version instead of `package.json`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected footer version read from `backend/pyproject.toml` (the backend's declared version) instead of `frontend/package.json`, since the footer now shows the backend's version

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change. `frontend/src/components/LandingPage.tsx` is not modified.

## Testing Strategy
- Unit tests (Vitest, frontend): `fetchBackendVersion` client behaviour (`frontend/src/api/version.test.ts`, stubbing global `fetch` as `notes.test.ts` does) and `AppFooter` render states (`frontend/src/components/AppFooter.test.tsx`, mocking `../api/version`). `LandingPage.test.tsx` mocks `../api/version` too so it never issues a real request.
  - Directory: co-located `frontend/src/**/*.test.ts(x)` (existing frontend convention; `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts(x)`
- Integration tests: no new ones. No backend code changes; the endpoint's contract is already covered by TEST-05's `backend/tests/integration/test_version_integration.py`, which criterion 2's row cites.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the real backend version on `/`, not the frontend's `0.0.0`; and the footer with `/api/version` aborted via `page.route` showing `Task Notes` alone. `TEST-04_page_footer.spec.ts` updated to the backend version source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-endpoint edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the footer on the landing page` | — |
| 2 | The version comes from a single declared source, the backend's GET /api/version at runtime, never a string typed into the component | Unit | `shows the backend version once /api/version resolves`, `requests /api/version from the default base URL and returns the version`, `test_get_version_returns_200_with_version_from_pyproject` | verifying the source needs no navigation or interaction: a mocked client value appearing in the render proves the component types no string, and TEST-05's router test proves the endpoint reads pyproject |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | `shows only the app name when the version request fails`, `shows only the app name when the backend reports the unknown sentinel`, `returns null when the response carries no usable version` | verifying it needs no navigation or interaction: it is a render rule over a rejected or empty client result |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `shows the backend version once /api/version resolves`, `shows only the app name when the version request fails` | the criterion is itself about the component test |
| 5 | The footer shows the backend's version, never the frontend bundle's, with the recorded loading and failure states | Unit | `shows only the app name while the version request is pending`, `does not show the frontend package.json version` | verifying it needs no navigation or interaction: it is a render rule per state; the real-backend path is also exercised by criterion 1's E2E spec |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, footer `app-footer` contains `Task Notes v` plus the version in `backend/pyproject.toml` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v0.1.0" |
| 2 | Single declared source, backend runtime | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0, When I open the landing page, Then the footer shows 0.1.0 and not the frontend's 0.0.0 |
| 3 | Unresolvable version renders without it | covered at Unit; edge-case E2E spec `shows the footer without a version when /api/version is unreachable` aborts the route | Given /api/version is unreachable, When I open the landing page, Then the footer shows exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |
| 5 | Backend's version, recorded loading and failure states | covered at Unit, see Criterion coverage | Given a slow /api/version, When the page loads, Then the footer shows "Task Notes" until the version arrives |

## Manual verification plan
Prerequisites for every block: the stack is up with `docker compose up -d --build` from the repo root (backend on http://localhost:8010, frontend on http://localhost:5183), and `backend/pyproject.toml` declares `version = "0.1.0"` while `frontend/package.json` declares `"version": "0.0.0"`.

### Criterion 1: The footer renders the version string on the landing page
1. Open http://localhost:5183/ in Chrome → the landing page shows the heading "Task Notes" and, at the bottom, a footer.
2. Read the footer text → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend's GET /api/version, never a string typed into the component
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ with DevTools → Network open, filter `version`, and reload → one request to `http://localhost:8010/api/version` with status 200, and the footer reads `Task Notes v0.1.0`.
3. In a terminal at the repo root run `grep -n "package.json\|0.1.0" frontend/src/components/AppFooter.tsx` → no output.

### Criterion 3: When the version cannot be resolved, the footer renders without it
1. Open http://localhost:5183/ with DevTools open; in Network, right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
2. Remove the block in DevTools → Network request blocking, then reload → the footer reads `Task Notes v0.1.0` again.
3. Run `docker compose stop backend`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes`. Run `docker compose start backend` afterwards.

### Criterion 4: A component test asserts both paths
1. From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`, and the output lists `shows the backend version once /api/version resolves` and `shows only the app name when the version request fails` as passed.

### Criterion 5: The backend's version, never the frontend's, with the recorded loading and failure states
1. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0` and nowhere shows `0.0.0` (the frontend `package.json` version).
2. In DevTools → Network set throttling to "Slow 3G" and reload → while the request is pending the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0`. Set throttling back to "No throttling".
3. The failure state is checked by Criterion 3 step 1: footer reads exactly `Task Notes`.
