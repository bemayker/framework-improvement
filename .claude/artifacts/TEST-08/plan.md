# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Acceptance criteria (tracker text):
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> Notes (tracker text): Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> Amended by the newest tracker comment (see Re-Plan Feedback): the version comes from the backend at runtime through GET /api/version, not from package.json at build time; the footer's loading and failure states are decided and recorded here.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend, fetched at runtime from GET /api/version, so a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) The footer's loading state (before GET /api/version resolves) and failure state (endpoint unreachable) are decided and recorded: both render the app name with no version, as below.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the comment overrides criterion 2's "frontend package metadata or a build-time variable". `AppFooter` stops importing `frontend/package.json` and fetches GET /api/version once on mount through a new client `frontend/src/api/version.ts`. The endpoint itself is NOT added by this item: GET /api/version already exists on main (d7663f0d) from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<backend/pyproject.toml [project].version>"}`, today `0.1.0`, read from installed package metadata, so it is already "the backend's version" in the comment's sense.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded, and it is neither a blank footer nor the word "unknown". In every non-resolved state the footer renders exactly `Task Notes` (the app name it shows today, no ` v` suffix, no placeholder, no gap):
  loading (request pending) renders `Task Notes`;
  failure (network error, non-2xx status, or a body without a non-empty string `version`) renders `Task Notes`;
  the backend's own "could not resolve" answer, the sentinel string `unknown` that `version_service.get_app_version()` returns when package metadata is missing, also renders `Task Notes`, because that is the backend saying the version cannot be resolved, which is criterion 3's case.
  Resolved renders `Task Notes v{version}`, e.g. `Task Notes v0.1.0`. Reason for this choice: criterion 3 asks for the footer "without it" when unresolved, and a footer that keeps its app name stays a footer (the contentinfo landmark is never empty), while showing `unknown` would display a version-shaped string that answers no question. The version text lives in its own `data-testid="app-version"` span that is only mounted when resolved, so "absent" is testable as an absent element, not a string match.
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The item is no longer frontend-only in behaviour, it now depends at runtime on the backend endpoint (the map row already lists TEST-05 as a dependency). It is still frontend-only in its diff: the backend change the comment asks for already shipped in TEST-05 on main, so `## Backend Plan` says no backend changes and the File Manifest carries no `[B]` entry. Assumption recorded: the comment's "Add a GET /api/version endpoint" is satisfied by the existing TEST-05 endpoint, whose contract (`{"version": str}`) is exactly what the footer needs; re-adding or altering it would be duplicate work.
- Comment (tracker), same comment: the partial-deploy rationale ("A footer that reports the frontend bundle's version tells you nothing about which API you are actually talking to") → Addressed by: the footer no longer shows the frontend bundle's version anywhere; `frontend/package.json`'s `version` (`0.0.0`) stops being read by any source or test file.

## Plan Overview
Frontend-only diff, runtime dependency on the existing backend endpoint GET /api/version (TEST-05). A new API client `frontend/src/api/version.ts` fetches the version; `AppFooter` calls it once on mount and renders `Task Notes v{version}` when it resolves and `Task Notes` otherwise. The API base URL, today a private constant in `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). `LandingPage.tsx` is not modified: the footer owns its own fetch, so the landing page keeps rendering `<AppFooter />` unchanged; only its test file gains a mock of the new client. TEST-04's E2E spec asserts the `frontend/package.json` version, which this item deliberately stops showing, so that spec is updated to drop the package.json version assertions (the version assertions move to this item's spec, against the backend's version).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`, so the existing default and env override are unchanged.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./baseUrl` instead of declaring it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `getVersion(): Promise<string>` does `fetch(`${API_BASE_URL}/api/version`)`; throws `Loading the version failed: {status} {statusText}` on a non-OK response (same shape as `notes.ts`'s `requestFailed`); throws `Unexpected version response` when the body's `version` is not a non-empty string. Exports `UNKNOWN_BACKEND_VERSION = "unknown"` with a comment naming `backend/app/services/version_service.py` `UNKNOWN_VERSION` as the value it mirrors, and returns the string as-is (the component decides display).
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)` + `useEffect` calling `getVersion()` once on mount with an `isMounted` guard (the pattern `LandingPage.tsx` already uses); on resolve, store the version unless it equals `UNKNOWN_BACKEND_VERSION`; on reject, keep `null` (no console noise, no rethrow). Render `<footer data-testid="app-footer">Task Notes{version && <span data-testid="app-version"> v{version}</span>}</footer>` so the unresolved footer text is exactly `Task Notes`. `APP_NAME` and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter` (`string | null`), no shared store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-04's existing footer style unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits it.

## Backend Plan
No backend changes required. The backend change the tracker comment asks for (GET /api/version returning the backend's version) already exists on main d7663f0d from TEST-05: `backend/app/routers/version.py` (`GET /api/version`, `response_model=VersionResponse`), `backend/app/services/version_service.py` (reads `task-notes-backend` package metadata, falls back to `unknown`), `backend/app/schemas/version.py`, registered in `backend/app/main.py`, and it answers without a database. This item consumes it and changes none of it, which is why no `[B]` entry appears in the File Manifest despite the item now depending on backend behaviour.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05; consumed, not changed)
- Request: no body, no parameters
- Response: 200 with `{"version": "0.1.0"}` (value is `backend/pyproject.toml` `[project].version`; `"unknown"` when the backend's package metadata is not installed)
- Frontend handling: 200 with a non-empty string other than `unknown` shows `Task Notes v{version}`; anything else (network error, non-2xx, malformed body, `unknown`) shows `Task Notes`.

## Technology Selection
- Version HTTP call (`frontend/src/api/version.ts`): chose the platform's native `fetch`, the same as `api/notes.ts`, over adding an HTTP library such as axios, because fetch covers a single GET and the project installs no HTTP library.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` (already installed) over a data-fetching dependency such as React Query or SWR, because one request on mount with a mounted guard is a few lines.
- Shared base URL module (`frontend/src/api/baseUrl.ts`): chose a two-line module reading Vite's built-in `import.meta.env` over duplicating the constant in the new client, because `coding_standards.md` Section 5 requires one source for a deployment-dependent value; no stdlib or dependency alternative applies.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` (env override, `http://localhost:8010` default), moved out of notes.ts
- [A] frontend/src/api/version.ts: `getVersion()` client for GET /api/version plus the `UNKNOWN_BACKEND_VERSION` sentinel constant
- [A] frontend/src/api/version.test.ts: client tests with `fetch` stubbed (OK body, default URL, non-OK throw, malformed body throw)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version from GET /api/version; footer shows only the app name when /api/version is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend on mount; render `Task Notes v{version}` when resolved, `Task Notes` while loading, on failure and on the backend's `unknown` sentinel; drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the package.json version test with present, pending, failed and unknown-sentinel tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version; drop the package.json import
- [D] e2e/tests/TEST-04_page_footer.spec.ts: drop the `frontend/package.json` version reads and assertions (the footer no longer shows that value); keep the app-name, landmark, heading and mobile-visibility assertions
`frontend/src/components/LandingPage.tsx` is deliberately not modified: `AppFooter` owns its fetch, so the landing page's `<AppFooter />` render is unchanged, which keeps this item off the file BUG-04 and TEST-10 also touch.
No dependency is added or changed, so no lockfile is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (the backend endpoint and `VITE_API_BASE_URL` already exist).
TEST-04's committed UAT scenario and script still describe the package.json version; they are TEST-04's historical artifacts and are not rewritten here.

## Testing Strategy
- Unit tests: frontend component and client tests (Vitest, the project's frontend unit tier). `AppFooter.test.tsx` with `../api/version` mocked covers present, pending, failed and `unknown` paths; `version.test.ts` with `fetch` stubbed covers the client's URL, success and throw branches; `LandingPage.test.tsx` covers the footer inside the page. No backend unit tests: no backend code changes.
  - Directory: beside their module under `frontend/src/` (project standards: tests beside their module)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`
- Integration tests: no new integration tests. The endpoint consumed is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (`test_get_version_returns_200_with_version_from_pyproject`), which stays green and untouched.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 through the browser against the running backend (version text equals `backend/pyproject.toml` `[project].version`, read by the spec from disk, the way the TEST-05 integration test does), plus the edge-case spec: `page.route("**/api/version", route => route.abort())` then the footer reads exactly `Task Notes`. TEST-04's spec is updated so it no longer asserts the package.json version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-endpoint edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from GET /api/version in the footer` | — |
| 2 | The version comes from one declared source, the backend's GET /api/version at runtime, never a string typed into the component | Unit | `renders the version the backend reports`, `returns the version the backend sent, from the default base URL` | verifying the source needs no navigation or interaction: it is which value the component renders for a mocked client response, and which URL the client calls |
| 3 | When the version cannot be resolved, the footer renders without it, no `undefined`, `null` or empty gap | Unit | `renders the app name without a version when the version request fails`, `renders the app name without a version when the backend reports an unknown version` | verifying it needs no navigation or interaction: it is a render branch on a rejected or sentinel client response (the E2E edge-case spec exercises it in the browser as well) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports`, `renders the app name without a version when the version request fails` | the criterion is itself a requirement for component tests |
| 5 | Loading and failure states decided and recorded: both render the app name with no version | Unit | `renders the app name without a version while the version request is pending`, `renders the app name without a version when the version request fails` | verifying it needs no navigation or interaction: a pending or rejected promise is a render branch, deterministic only with the client mocked |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | goto `/`, expect `app-version` to contain the pyproject version and `app-footer` to contain `Task Notes v{version}` | Given the backend is running, When I open the landing page, Then the footer reads `Task Notes v0.1.0` |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given GET /api/version returns `0.1.0`, When I open the landing page, Then the footer shows `0.1.0` and not the frontend's `0.0.0` |
| 3 | Unresolvable version renders without it | covered at Unit; edge-case spec aborts `/api/version` and expects the footer text to be exactly `Task Notes` | Given /api/version is unreachable, When I open the landing page, Then the footer reads `Task Notes` with no version and no `undefined` |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run it, Then both footer paths pass |
| 5 | Loading and failure states recorded | covered at Unit, see Criterion coverage | Given /api/version has not answered yet, When the landing page renders, Then the footer reads `Task Notes` |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: backend running on `http://localhost:8010` via `uv run` (so package metadata is installed), frontend dev server on `http://localhost:5183`, `backend/pyproject.toml` `[project].version` is `0.1.0`.
1. In a terminal run `curl http://localhost:8010/api/version` → the response body is `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` in a browser → the landing page shows the `Task Notes` heading.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend package
Prerequisites: as for Criterion 1; `frontend/package.json` `version` is `0.0.0`.
1. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
2. Open the browser DevTools Network tab and reload → one request to `http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}`.
3. Stop the backend, change `backend/pyproject.toml` `[project].version` to `0.1.1`, run `uv sync --directory backend`, start the backend again; do not rebuild or restart the frontend. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1`. Revert `[project].version` to `0.1.0` and re-sync afterwards.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: frontend dev server on `http://localhost:5183`.
1. Stop the backend so `http://localhost:8010` does not answer.
2. Open `http://localhost:5183/` → the footer reads exactly `Task Notes`: no ` v`, no `undefined`, no `null`, no `unknown`, and no trailing space or empty gap after the name.
3. Start the backend again and reload → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed.
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Check the run lists `renders the version the backend reports` and `renders the app name without a version when the version request fails` among the passed tests.

### Criterion 5: Loading and failure states are decided: both show the app name only
Prerequisites: backend and frontend running as for Criterion 1.
1. In Chrome DevTools open the Network request blocking panel, add the pattern `*/api/version`, and reload `http://localhost:5183/` → the footer reads `Task Notes` (the failure state).
2. Remove the block, set Network throttling to `Slow 3G`, and reload → while the `/api/version` request is still pending the footer reads `Task Notes`; once it completes it changes to `Task Notes v0.1.0` (the loading state, then resolved).
3. Reset throttling to `No throttling`.
