# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the tracker).**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Correction (tracker comment, newest, overrides the description where they disagree):** the version must come from the backend at runtime via `GET /api/version`, not from `package.json` at build time; a frontend rebuilt against an older backend must show the backend's version. Record the loading and the failure state explicitly, and say in the plan that this is no longer a frontend-only item.

## Acceptance Criteria
<!-- Criteria 2 to 4 carry the tracker comment's correction; the amendment is marked on each. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by the tracker comment) The version comes from a single declared source, the backend at runtime through `GET /api/version`, never from `frontend/package.json`, a build-time variable, or a string typed into the component. A frontend whose bundle declares one version, served against a backend reporting another, shows the backend's version.
- [ ] 3. When the version cannot be resolved (`/api/version` unreachable, a non-2xx response, a body without a non-empty string `version`, or the backend's own `"unknown"` sentinel), the footer renders `Task Notes` without it, rather than showing `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. (added by the tracker comment) Before the `/api/version` request settles, the footer renders `Task Notes` with no version and no placeholder text: the same output as the failure state, decided and recorded below.
- [ ] 5. A component test asserts both paths: version present, and version absent (and the pending state of criterion 4).

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  (a) Source: criterion 2 is rewritten to the backend runtime source. `AppFooter.tsx` stops importing `frontend/package.json` and fetches `GET /api/version` through a new client `frontend/src/api/version.ts`.
  (b) The backend endpoint: **this item no longer is frontend-only in behaviour, but it needs no backend file change.** `GET /api/version` already exists on `main`, delivered by TEST-05 (one of this item's own dependencies, done): `backend/app/routers/version.py`, `services/version_service.py` and `schemas/version.py` return `{"version": "<backend/pyproject.toml [project].version>"}` from installed package metadata, CORS already allows `GET` from `http://localhost:5183` (`backend/app/core/config.py`, `backend/app/main.py`), and `backend/tests/integration/test_version_integration.py` already covers it. Adding the endpoint again would duplicate TEST-05, so the Backend Plan says "No backend changes required" and states this; the runtime dependency on the backend is recorded under Plan Overview and Backend Plan rather than appearing silently.
  (c) Loading state, decided: the footer renders exactly `Task Notes` (no `v`, no version, no "Loading…" text, no spinner). Chosen so the footer never shows a value it has not received and never changes height or wording except to append ` v{version}` once.
  (d) Failure state, decided: identical to loading, exactly `Task Notes`. Not blank (the app name stays, as TEST-04 established) and never `unknown`: the backend's own `"unknown"` sentinel (`UNKNOWN_VERSION` in `backend/app/services/version_service.py`) is treated by the client as "cannot be resolved", so the literal word never reaches the footer. A request that never settles stays in the loading output, which is the same text; no timeout is added (not in the criteria; CHORE-02 is the recorded follow-up for a fetch timeout).
- Comment (tracker, operator note of 2026-09-07 about a sandbox state reset) → not acted on because it is operational, not a requirement (relayed as such by the dispatching session).
- Merged since the last plan: n/a (fresh plan, no previous plan for this item; plan base `1cee27a`).

## Plan Overview
Frontend change with a runtime dependency on an existing backend endpoint:
- New API client `frontend/src/api/version.ts` calling the backend's `GET /api/version` (TEST-05) and returning the version string, or throwing when it cannot be resolved.
- The API base URL, today a private constant in `frontend/src/api/notes.ts`, moves into `frontend/src/api/baseUrl.ts` so both clients read one value from one source (the one-value-one-source rule of `coding_standards.md`, and its DRY principle in Section 1).
- `AppFooter.tsx` fetches the version on mount and renders `Task Notes` until (and unless) a version resolves, then `Task Notes v{version}`.
- `LandingPage.tsx` is **not** modified (the footer owns its own fetch), which keeps this item off the file BUG-04 edits; only its test file changes, because that test asserted the old `package.json` source.
- TEST-04's E2E spec and UAT artifacts asserted the footer against `frontend/package.json` (0.0.0); the footer now shows the backend version (0.1.0), so they are updated to the backend source.
- No backend file changes: the endpoint exists (Re-Plan Feedback (b)).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, the exact resolution `notes.ts` uses today, moved, not changed.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged (its existing tests, including the `VITE_API_BASE_URL` override test, must stay green unchanged).
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }`; `export async function getBackendVersion(): Promise<string>` fetches `${API_BASE_URL}/api/version`; throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response; throws when the body has no non-empty string `version`; throws when `version === "unknown"` (constant `UNKNOWN_VERSION_SENTINEL`, with a comment naming `backend/app/services/version_service.py` as its origin). Network errors propagate as the rejected `fetch`. Reads only the `version` field, so extra fields a concurrent backend item adds (TEST-09's build commit) are ignored.
  - `frontend/src/components/AppFooter.tsx` (modified): drop the `package.json` import; `useState<string | null>(null)` plus a `useEffect` calling `getBackendVersion()` once on mount with the same `isMounted` guard `LandingPage.tsx` uses; on reject, stay `null`. Render `<footer data-testid="app-footer">Task Notes{version !== null && <span data-testid="app-footer-version"> v{version}</span>}</footer>`, keeping the existing `footerStyle` values unchanged.
- Routes: none.
- State management: local component state in `AppFooter` (`version: string | null`, `null` meaning pending or unresolved; both render the same text by decision).
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing inline values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span adds no styles.

## Backend Plan
No backend changes required.

<!-- Stated explicitly per the tracker comment: the corrected item depends at runtime on the backend, but the endpoint it needs, GET /api/version returning {"version": ...} from backend/pyproject.toml package metadata, was delivered by TEST-05 (a dependency of this item, done) and is already on main with integration coverage and CORS for the frontend origin. No router, service, schema or test file is added or edited here. -->

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`; existing endpoint from TEST-05, consumed unchanged)
- Request: no body, no parameters
- Response: 200 `{"version": "0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`; `"unknown"` when the backend cannot read its own package metadata). Additional fields may appear (TEST-09) and are ignored by the client.
- Client contract: `getBackendVersion()` resolves to the version string, or rejects for: network failure, non-2xx, a body that is not an object with a non-empty string `version`, and the `"unknown"` sentinel.

## Technology Selection
- Version API client `frontend/src/api/version.ts`: chose the browser's native `fetch` over adding an HTTP library (axios or similar), because `fetch` covers one GET with a status check and is what `notes.ts` already uses.
- Fetch-on-mount in `AppFooter`: chose React's own `useState` and `useEffect` (installed) over a data-fetching dependency (React Query, SWR), because one request on mount with no caching or refetch needs nothing more.
- Shared base URL module `frontend/src/api/baseUrl.ts`: chose moving the existing `import.meta.env` resolution (Vite, installed) out of `notes.ts` over a config library or a second copy of the constant, because the value already exists and only needs one owner.
- E2E helper `e2e/helpers/backendVersion.ts` reading `backend/pyproject.toml`: chose Node's standard `node:fs` plus a regular expression over the `[project]` table's `version` line, over adding a TOML parser dependency, because one known key in a file this repo controls needs no parser.
- No new dependency is added anywhere, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single owner of the API base URL (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved out of notes.ts
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for GET /api/version, with the unresolved cases (non-OK, malformed body, "unknown" sentinel) rejecting
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client with `fetch` stubbed (resolved version, non-OK, malformed body, "unknown" sentinel, network rejection, URL built from the shared base URL)
- [D] e2e/helpers/backendVersion.ts: reads `[project].version` from backend/pyproject.toml, shared by the TEST-04 and TEST-08 specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend's version; footer shows exactly "Task Notes" when /api/version is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from ./baseUrl instead of declaring it; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the backend version on mount, render `Task Notes` or `Task Notes v{version}` with the version in a `app-footer-version` span
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with mocked-client tests for resolved, rejected, pending and sentinel paths
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: take the expected version from the backend (e2e/helpers/backendVersion.ts) instead of frontend/package.json
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version-source step now names backend/pyproject.toml (served by GET /api/version) instead of frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare against backend/pyproject.toml instead of frontend/package.json

Neither README.md nor docs/DEVELOPMENT.md needs an edit: this item changes no project structure, run configuration, dependency or test infrastructure (the new e2e helper sits in the existing e2e/helpers/ directory). No lockfile changes: no dependency is added or removed.

## Testing Strategy
- Unit tests (Vitest, co-located under `frontend/src/`, `*.test.ts(x)` as the existing frontend tests are):
  - `frontend/src/api/version.test.ts`: `fetch` stubbed with `vi.stubGlobal` as in `notes.test.ts`; resolves `"0.1.0"` from `{"version": "0.1.0"}` and from a body with an extra `commit` field; calls `http://localhost:8010/api/version` by default; rejects with `Loading the version failed: 503 Service Unavailable` on a non-OK response; rejects on `{}`, on `{"version": ""}` and on `{"version": 3}`; rejects on `{"version": "unknown"}`; rejects when `fetch` itself rejects.
  - `frontend/src/components/AppFooter.test.tsx`: `vi.mock("../api/version")`; resolved `"9.9.9"` (deliberately different from frontend/package.json's `0.0.0`) renders `Task Notes v9.9.9` and an `app-footer-version` span; rejected renders exactly `Task Notes`, no `app-footer-version` element, and text containing none of `undefined`, `null`, `unknown`, ` v`; a never-settling promise renders exactly `Task Notes`; the footer keeps the `contentinfo` role and `app-footer` test id; the client is called once.
  - `frontend/src/components/LandingPage.test.tsx`: mock `../api/version` alongside `../api/notes`, assert the footer shows the mocked backend version.
  - Directory: frontend tests are co-located in `frontend/src/` (the configured `backend/tests/unit/` directory is the backend's; no backend tests change).
  - Naming: the frontend's existing `{Module}.test.ts(x)` convention.
- Integration tests: no new integration test. The only API this item consumes is `GET /api/version`, whose router behaviour is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05); no backend code changes here.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts`: (1) open `/`, the `app-footer` element has exact text `Task Notes v{backend version read from backend/pyproject.toml}`, which differs from frontend/package.json's `0.0.0`, proving the runtime source through the real browser and CORS path; (2) edge case: `page.route("**/api/version", route => route.abort())`, open `/`, the footer has exact text `Task Notes` and `app-footer-version` has count 0. Also update `e2e/tests/TEST-04_page_footer.spec.ts` to expect the backend version via `e2e/helpers/backendVersion.ts`.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via GET /api/version; a frontend against a backend reporting another version shows the backend's | E2E | — (the cross-origin runtime wiring only fails in a browser; the spec asserts the backend's 0.1.0 against a bundle declaring 0.0.0, with unit tests in AppFooter.test.tsx and version.test.ts covering the source logic) |
| 3 | When the version cannot be resolved, the footer renders `Task Notes` without it, never `undefined`, `null`, `unknown` or an empty gap | Unit | verifying it needs no navigation or interaction: it is the component's render for a rejected client, asserted in AppFooter.test.tsx and version.test.ts (one E2E edge-case spec also exercises the aborted request) |
| 4 | Before the request settles, the footer renders `Task Notes` with no placeholder | Unit | verifying it needs no navigation or interaction: a pending promise is a render state, reproducible only deterministically in a component test |
| 5 | A component test asserts both paths: version present and version absent | Unit | the criterion is itself a component test, in AppFooter.test.tsx |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Open `/`, `getByTestId("app-footer")` has text `Task Notes v{backend version}` | Given the app is running When I open the landing page Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | Same spec: expected value read from backend/pyproject.toml, not frontend/package.json (0.0.0) | Given GET /api/version reports "0.1.0" and frontend/package.json declares "0.0.0" When I open the landing page Then the footer shows "0.1.0" |
| 3 | Unresolvable version renders `Task Notes` alone | covered at Unit, see Criterion coverage; plus the aborted-request edge-case spec | Given the backend is stopped When I open the landing page Then the footer reads exactly "Task Notes" |
| 4 | Pending state renders `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered yet When the landing page renders Then the footer reads exactly "Task Notes" |
| 5 | Component test covers present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite When I run AppFooter.test.tsx Then 0 tests fail |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010); `backend/pyproject.toml` `[project].version` reads `0.1.0`.
1. Open `http://localhost:5183/` in a browser → the "Task Notes" heading, the note form and the footer are visible.
2. Read the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend bundle
Prerequisites: as for criterion 1.
1. In a terminal, run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}` (possibly with extra fields if TEST-09 has merged).
2. Open `frontend/package.json` and read its `version` field → it reads `0.0.0`.
3. Reload `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's value, and does not contain `0.0.0`.
4. Open DevTools → Network, reload, and select the `version` request → it is a GET to `http://localhost:8010/api/version` with status 200, made at page load (the version is fetched at runtime, not baked into the bundle).

### Criterion 3: An unresolvable version renders the footer without it
Prerequisites: as for criterion 1.
1. In a terminal at the repository root, run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183/` and read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing gap after the name.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: Before the request settles, the footer renders the name with no placeholder
Prerequisites: as for criterion 1. The pending state lasts milliseconds on a local stack, so the manual check slows the request rather than catching it.
1. Open DevTools → Network, set throttling to `Slow 3G`, and reload `http://localhost:5183/` → while the `version` request is still pending in the Network list, the footer reads exactly `Task Notes`, with no "Loading", spinner or `v`.
2. Wait for the `version` request to finish → the footer changes to `Task Notes v0.1.0` without any other text or layout change.
3. Set throttling back to `No throttling`. The deterministic check is the component test `renders only the app name while the version request is pending` in `frontend/src/components/AppFooter.test.tsx` (criterion 5's command runs it).

### Criterion 5: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, running `AppFooter.test.tsx` (resolved, rejected, pending and sentinel cases) and `version.test.ts`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test asserting `Task Notes v9.9.9` for a resolved version and a test asserting exactly `Task Notes` for a rejected request.
