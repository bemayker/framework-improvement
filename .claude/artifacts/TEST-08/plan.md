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
> Source: ClickUp task 123k99ctgch (workspace 30307190, list 901524718831), https://app.clickup.com/t/123k99ctgch. The newest tracker comment corrects the description (see Re-Plan Feedback); the criteria below are the description's criteria as amended by that comment, which overrides the description where the two disagree.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by the tracker comment) The version comes from the backend at runtime, read from `GET /api/version`, never from `frontend/package.json` at build time and never from a string typed into the component: a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (the request fails, `/api/version` is unreachable or answers non-200, the body has no usable `version` string, or the backend reports its `unknown` sentinel), the footer renders without it: it reads `Task Notes` alone, never `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by the tracker comment) Before the version request resolves, the footer reads `Task Notes` alone: no placeholder, no spinner, no blank footer.
- [ ] 6. (added by the tracker comment) `GET /api/version` returns the backend's own version. This endpoint already exists on main (TEST-05), so this criterion is satisfied by existing code and its existing integration test, and this item makes no backend change (see Plan Overview).

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  - Source of the version: criterion 2 is rewritten to the backend at runtime. `AppFooter` stops importing `frontend/package.json` and fetches `GET /api/version` through a new client module (`frontend/src/api/version.ts`). The E2E spec proves the "older backend" property by asserting the footer shows the value the browser received from `/api/version` (backend `0.1.0`) and not the frontend bundle's `0.0.0`.
  - The endpoint: `GET /api/version` already exists on main, added by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), and it already returns the backend's version read from `backend/pyproject.toml` package metadata as `{"version": "0.1.0"}`. Its CORS middleware already allows `GET` from the frontend origin `http://localhost:5183`. So the backend change the comment anticipates is **not needed**: nothing is added or edited under `backend/`, the File Manifest carries no `[B]` entry, and the Backend Plan says so explicitly. What does change is the item's runtime shape: it is no longer frontend-isolated, because the footer now depends on the backend being reachable. That is recorded here and in the Plan Overview rather than left implicit. Recorded as criterion 6, covered by the existing `backend/tests/integration/test_version_integration.py`.
  - Loading state (decided): before the request resolves the footer renders `Task Notes` alone, the same text as the failure state, with no placeholder. Chosen because a placeholder (`v…`, `loading`) would flash on every page load for a value that arrives in milliseconds, and the app name already keeps the footer from being blank. Criterion 5.
  - Failure state (decided): if `/api/version` is unreachable, answers non-200, returns a malformed body or an empty string, or returns the backend's `unknown` sentinel (`version_service.UNKNOWN_VERSION`, returned when package metadata is missing), the footer renders `Task Notes` alone. Not blank (the app name stays, so the footer never collapses to an empty landmark) and not `unknown` (a reader cannot tell `unknown` apart from a real version string, and the original criterion 3 forbids rendering an unresolved value). The backend's own `unknown` sentinel is deliberately treated as "unresolved" for the same reason. Criterion 3.
  - Assumption recorded (ambiguity, not blocking): the comment says "add a GET /api/version endpoint"; read as "the footer must use a backend endpoint that returns the backend's version", which the existing endpoint satisfies exactly. No second endpoint and no change to its response shape is planned.
- Other tracker comments: the main session's record (`.claude/artifacts/TEST-08/decisions.md`) counts 18 tracker comments with 1 actionable; only the actionable one reached this dispatch, and it is the one above. No PR review comments and no `[merged-since]` lines were supplied (fresh plan, base c5a6e64).

## Plan Overview
The footer (`frontend/src/components/AppFooter.tsx`, from TEST-04) currently prints `Task Notes v{version}` with `version` imported from `frontend/package.json` (`0.0.0`). This item makes it fetch the running backend's version from the existing `GET /api/version` (TEST-05, returns `0.1.0`) when it mounts, and render:

- resolved: `Task Notes v0.1.0` (the version in its own `data-testid="app-footer-version"` span);
- loading: `Task Notes`;
- failed or unresolved: `Task Notes`.

Layers touched: frontend only in code. A new API client module wraps the call, following the existing `frontend/src/api/notes.ts` pattern (components never call `fetch` directly). The API base URL (`VITE_API_BASE_URL`, default `http://localhost:8010`) is currently defined inside `notes.ts`; a second client would duplicate that deployment-dependent value, so it moves to one small module both clients import (the coding standards' "one value, one source" rule for deployment-dependent values).

**Backend change, stated explicitly as the comment asks:** the description frames this item as frontend-only, the comment says it now needs a backend endpoint, and the endpoint is already on main from TEST-05. This plan therefore changes no backend file. The runtime dependency is real, though: the footer's version now depends on the backend being up and CORS allowing the frontend origin, both true in `docker-compose.yml` and `backend/app/core/config.py` today. Concurrently, TEST-09 (same wave) extends this same endpoint with a commit field; that change is additive, and this item's client reads only `version` and ignores extra fields, so the two do not collide (see shared_risks.md).

`LandingPage.tsx` is **not** modified (the footer fetches its own data), which keeps this item off the file BUG-04 may edit. `LandingPage.test.tsx` is modified because it asserts the `package.json` version and would otherwise issue a real fetch from jsdom. The TEST-04 E2E spec is modified for the same reason: it asserts the footer shows `frontend/package.json`'s version, which this item deliberately makes false.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; hold `version: string | null` in `useState(null)`; in a mount `useEffect` call `fetchBackendVersion()`, set the result when the component is still mounted (same `isMounted` guard as `LandingPage.tsx`), and on rejection leave it `null`. Render `Task Notes` followed, only when `version` is a non-empty string, by ` ` and `<span data-testid="app-footer-version">v{version}</span>`. Keep `<footer data-testid="app-footer">` and its existing style object unchanged.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. `fetch(`${API_BASE_URL}/api/version`)`; throws `Loading the version failed: {status} {statusText}` on a non-OK response (same shape as `notes.ts`); throws on a body whose `version` is not a string; returns `null` when the string is empty after trimming or equals `unknown`; otherwise returns the trimmed string. Network errors propagate as the `fetch` rejection.
- Routes: none.
- State management: local component state in `AppFooter` (`useState` and `useEffect`); no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing inline style unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the version span adds no styling of its own.

## Backend Plan
No backend changes required.

The comment's `GET /api/version` already exists on main (TEST-05): router `backend/app/routers/version.py`, service `backend/app/services/version_service.py` (reads `task-notes-backend` package metadata, returns `unknown` when it is missing), schema `backend/app/schemas/version.py` (`{"version": str}`), registered in `backend/app/main.py` with CORS `GET` allowed from `http://localhost:5183`. Criterion 6 is covered by the existing `backend/tests/integration/test_version_integration.py`, which this item does not edit.

## API Integration Plan
No external API integration. (The call is to this project's own backend; its client follows `notes.ts`'s pattern.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL}/api/version` (default `http://localhost:8010/api/version`)
- Request: no body, no parameters.
- Response: 200, JSON. Existing shape from TEST-05, consumed as-is:

```json
{"version": "0.1.0"}
```

- The client reads `version` only and ignores any other field (TEST-09 may add one concurrently). `version` equal to `unknown` or empty is treated as unresolved. Non-200, network failure or a non-string `version` reject, and the footer treats them as unresolved.

## Technology Selection
- Version request (`frontend/src/api/version.ts`): chose the platform `fetch` over a request library (none is installed, and the existing `notes.ts` client already uses `fetch`), because a single GET needs nothing more.
- Loading and failure state in `AppFooter`: chose React's built-in `useState` and `useEffect` (installed `react`) over a data-fetching library such as React Query or SWR (not installed), because one request on mount with two outcomes is a few lines; no new dependency.
- API base URL module (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers it; it is a two-line extraction of the value `notes.ts` already defines, so both clients read one source (Vite's `import.meta.env`, already used, stays the mechanism).
- Response shape check: chose a plain `typeof body.version === "string"` check over a schema library (zod and similar are not installed), because one string field needs no validator.
- Tests: Vitest and Testing Library (installed) for unit and component tests, Playwright (installed) for E2E, including `page.route` to simulate an unreachable endpoint; no new dependency.

## File Manifest
<!-- Phase tags: see the plan template; tags are machine-parsed. -->
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, returning the backend's version or `null` when it reports none usable, throwing on HTTP, network and shape failures
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed (OK, non-OK, malformed body, `unknown`, empty, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec: footer shows the version the browser received from `/api/version` and not the frontend package version; footer reads `Task Notes` alone when `/api/version` is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render `Task Notes v{version}` when resolved and `Task Notes` alone while loading or when unresolved; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, version absent (rejected and `null`), and the loading state; keep the landmark and test-id assertions
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` so the page test issues no real request; replace the `package.json` version assertion with the mocked backend version
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the footer shows the version from the `/api/version` response instead of `frontend/package.json`'s, which this item deliberately makes false

No lockfile changes: no dependency is added or removed.

No documentation edit: this item changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15's condition), and `docs/DEVELOPMENT.md` already describes the footer showing the version the backend reports.

TEST-04's own UAT artifacts (`e2e/uat/scenarios/TEST-04_page_footer.feature`, `e2e/uat/scripts/TEST-04_page_footer_uat_script.md`) say the footer version matches `frontend/package.json`; they are left unedited as TEST-04's acceptance record (they are validated for well-formedness, never executed), and TEST-08's own scenarios and script supersede them. Noted for the PR description.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed like `notes.test.ts`): returns `0.1.0` from an OK body from the default URL `http://localhost:8010/api/version`; returns `null` for `{"version": "unknown"}` and `{"version": ""}`; ignores an extra field; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response; throws on a body with no string `version`; uses `VITE_API_BASE_URL` when stubbed. The footer component (`AppFooter.test.tsx`, `../api/version` mocked): version present renders `Task Notes v0.1.0` and the `app-footer-version` span; rejected request and `null` both render exactly `Task Notes` with no `app-footer-version` span and no `undefined`, `null` or `unknown` text; a never-settling promise renders exactly `Task Notes` (loading state); landmark and `data-testid` unchanged. `LandingPage.test.tsx` mocks `../api/version` and asserts the footer shows the mocked version. `notes.test.ts` is unchanged and must still pass after the base-URL move.
  - Directory: frontend tests live beside their modules under `frontend/src/` (existing convention: `*.test.ts(x)`, run by `npm --prefix frontend test`). The backend unit directory `backend/tests/unit/` gets nothing new.
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing frontend files.
- Integration tests: no new integration test. The only backend behaviour involved (criterion 6) is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05), which this item does not touch.
  - Directory: backend/tests/integration/
- E2E tests: footer on the landing page shows the version from the real `/api/version` response (match the response by exact pathname `/api/version`, never a substring, because Vite serves the module `src/api/version.ts` from a URL containing the same substring, as the TEST-03 spec documents for notes), asserted not `unknown` and different from the frontend package version `0.0.0`; edge case: `page.route` aborts requests whose pathname is `/api/version`, and the footer's text is exactly `Task Notes` with no `app-footer-version` element. Update the TEST-04 spec's version assertions to the response's version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per acceptance criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, not from `package.json` or a literal; an older backend's version is shown | E2E | — |
| 3 | When the version cannot be resolved the footer reads `Task Notes` alone, never `undefined`, `null`, `unknown` or a gap | Unit | verifying it needs no navigation or interaction: it is a component render state driven by a mocked client outcome (rejected, `null`); the E2E abort spec is additionally the feature's edge-case spec |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test in `AppFooter.test.tsx`; it is satisfied by that test existing and passing |
| 5 | Before the request resolves the footer reads `Task Notes` alone | Unit | verifying it needs no navigation or interaction: it is the component's initial render with a pending promise, which a browser cannot hold open deterministically without the same mocking |
| 6 | `GET /api/version` returns the backend's own version | Integration | verifying it needs no navigation or interaction: it is a router behaviour, already covered by the existing `test_version_integration.py` (TEST-05) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, await the `GET /api/version` response, expect `app-footer` to contain `v{response.version}` and `app-footer-version` to be visible | Given the app and backend are running, When I open the landing page, Then the footer shows "Task Notes v" followed by a version |
| 2 | Version comes from the backend at runtime | Same spec: expect the footer version to equal the response's `version`, to not equal `unknown`, and to differ from `frontend/package.json`'s `0.0.0` | Given the backend reports version 0.1.0 and the frontend package says 0.0.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Unresolvable version renders the footer without it | covered at Unit, see Criterion coverage; E2E edge spec aborts `/api/version` and expects footer text exactly `Task Notes` | Given the backend's version endpoint is unreachable, When I open the landing page, Then the footer shows "Task Notes" and no version, "unknown", "undefined" or "null" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |
| 5 | Loading state shows `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered yet, When the landing page renders, Then the footer shows "Task Notes" only |
| 6 | `GET /api/version` returns the backend's version | covered at Integration, see Criterion coverage | Given the backend is running, When I request /api/version, Then the response is 200 with the version from backend/pyproject.toml |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d` from the repository root (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open http://localhost:5183/ in a browser → the landing page shows the "Task Notes" heading, the note form and, at the bottom, a footer.
2. Read the footer → it reads `Task Notes v0.1.0`.
3. Right-click the footer and choose Inspect → the `<footer data-testid="app-footer">` element contains a `<span data-testid="app-footer-version">` whose text is `v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: same stack as Criterion 1; browser DevTools open on the Network tab.
1. Reload http://localhost:5183/ → the Network tab lists a `GET` request to `http://localhost:8010/api/version` with status 200.
2. Click that request and open its Response tab → the body is `{"version":"0.1.0"}`.
3. Open `frontend/package.json` in the repository → its `"version"` is `"0.0.0"`.
4. Compare with the footer → the footer reads `v0.1.0` (the backend's value), not `v0.0.0` (the frontend package's value).
5. Open `frontend/src/components/AppFooter.tsx` → it imports nothing from `package.json` and contains no version literal.

### Criterion 3: When the version cannot be resolved the footer renders without it
Prerequisites: same stack as Criterion 1.
1. Run `docker compose stop backend` from the repository root → the command reports the backend container stopped.
2. Reload http://localhost:5183/ → the Network tab shows the `GET /api/version` request failing (status "(failed)" or a connection error).
3. Read the footer → it reads exactly `Task Notes`, with no `v`, no `unknown`, no `undefined`, no `null` and no trailing gap; Inspect shows no `app-footer-version` element.
4. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers in a new tab, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root → the run reports 0 failed, and its test names include a version-present case and a version-absent case.
2. Open `frontend/src/components/AppFooter.test.tsx` → one test mocks the version client to resolve `0.1.0` and expects `Task Notes v0.1.0`; another mocks it to reject (and one to resolve `null`) and expects exactly `Task Notes` with no `app-footer-version` element.

### Criterion 5: Before the request resolves the footer reads `Task Notes` alone
Prerequisites: same stack as Criterion 1; Chrome DevTools open.
1. In DevTools, open the Network request blocking panel (Command menu, "Show Request blocking"), add the pattern `*/api/version`, and enable it → the pattern is listed and checked.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes` (this is also what a still-pending request looks like: the loading and failure states render the same text by design).
3. For the pending state itself, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → 0 failed, including the test that renders the footer with a request that never settles and expects exactly `Task Notes`.
4. Remove the blocking pattern and reload → the footer reads `Task Notes v0.1.0`.

### Criterion 6: `GET /api/version` returns the backend's own version
Not verifiable through the UI on its own; the observable check is the endpoint's response.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}`, matching `version = "0.1.0"` in `backend/pyproject.toml`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the backing database available → 0 failed.
