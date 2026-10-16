# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Notes: Frontend only, under `frontend/src/`. Modifies `LandingPage.tsx` (TEST-04's footer is there). Serialization: BUG-04 and later TEST-10 also edit LandingPage.tsx and will build after this item merges.
>
> Depends on TEST-04 (page footer) and TEST-05 (backend version endpoint), both done.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **As corrected by the tracker comment below, the single declared source is the backend, read at runtime from `GET /api/version`.**
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, human correction, newest actionable): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the comment overrides the description and criterion 2's wording. The footer no longer imports `frontend/package.json`; it fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts`, and renders the `version` field of that response. The single declared source is therefore `[project].version` in `backend/pyproject.toml`, which TEST-05's `version_service.get_app_version()` reads from installed package metadata.
- Comment (tracker, same comment), "Add a GET /api/version endpoint" → Addressed by: **no backend change is needed, and none is planned.** Verified on main at 183fb15: TEST-05 already ships `GET /api/version` (`backend/app/routers/version.py`, registered in `backend/app/main.py`, schema `backend/app/schemas/version.py`, covered by `backend/tests/integration/test_version_integration.py`). CORS already allows `GET` from the browser origin. So the item stays frontend-only in its File Manifest; the backend dependency is explicit here and in `## Backend Plan` rather than silent. Had the endpoint not existed, this would have added a backend phase to what the description frames as a frontend-only item, which is exactly what the comment asked to be called out.
- Comment (tracker, same comment), "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers." → Addressed by these recorded decisions:
  - **Loading state (fetch pending):** the footer renders `Task Notes` only, with no version segment, no `v`, no spinner and no placeholder text. The footer element itself is present from the first render, so the page layout does not jump; when the fetch resolves, ` v0.1.0` (the resolved value) is appended in place.
  - **Failure state (`/api/version` unreachable, non-2xx, or a body without a non-empty string `version`):** the footer renders `Task Notes` only, identical to the loading state. It never reads `unknown`, `undefined`, `null`, `v` with nothing after it, or an empty gap. Chosen over `unknown` because criterion 3 says the footer renders *without* the version when it cannot be resolved, and `unknown` is text standing where a version should be rather than its absence. The footer is never blank: the app name always renders.
  - **Backend sentinel:** TEST-05 returns the literal `unknown` when the backend distribution metadata is not installed (`UNKNOWN_VERSION` in `version_service.py`). That is the backend saying the version could not be resolved, so the client treats it exactly like the failure state and the footer omits it. Assumption recorded: matching that one sentinel string in the frontend is preferred to showing `vunknown` to the user.
  - **No retry and no polling:** one fetch on mount. A transient failure leaves the footer at `Task Notes` until the next page load. Retrying is not asked for by any criterion (`user_story_alignment.md` Section 3).
- Comment (tracker, same comment), "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Addressed by: said so above and in `## Backend Plan`. The runtime coupling is new even though the code change is frontend-only: the footer now depends on the backend being reachable from the browser, which it did not before.
- Dispatch note (not a tracker comment, recorded for traceability): TEST-09, building concurrently, adds a `commit` field to the `/api/version` response. → Addressed by: the client reads only `version` and ignores every other field, so the plan works against the response both before and after TEST-09 merges, and touches no file TEST-09 touches.
- Description note "Modifies `LandingPage.tsx` (TEST-04's footer is there)" → not acted on as written, because the code disagrees: TEST-04 extracted the footer into `frontend/src/components/AppFooter.tsx`, and `LandingPage.tsx` only renders `<AppFooter />`. The fetch lives in `AppFooter.tsx`, so `LandingPage.tsx` is **not modified**; only its test file changes (it currently asserts the `package.json` version). This narrows the overlap with BUG-04 and TEST-10 to `LandingPage.test.tsx`.
- Other tracker comments (bot notices of earlier unmerged PRs, an operator reset note) → not acted on: they carry no requirement for this item.
- Merged since the last plan: n/a (fresh plan, branched from current main at 183fb15).

## Plan Overview
Frontend-only change against an existing backend endpoint. A new API client module `frontend/src/api/version.ts` fetches `GET /api/version` from the same base URL the notes client uses (extracted into `frontend/src/api/baseUrl.ts` so both clients read `VITE_API_BASE_URL` from one place). `AppFooter.tsx` drops its `package.json` import, fetches the version once on mount, and renders `Task Notes v0.1.0`-style text when a version resolves, or `Task Notes` alone while loading and on any failure. Tests: client unit tests, component tests for both paths (criterion 4), the landing-page test updated to mock the new client, a new E2E spec for the rendered version plus an unreachable-endpoint edge case, and TEST-04's E2E spec updated because it currently expects the frontend `package.json` version (0.0.0), which the footer will no longer show. No backend, no database, no dependency change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL` with the existing documented default `http://localhost:8010`. Moved verbatim out of `notes.ts` so the two clients cannot disagree on the backend origin (`coding_standards.md` Section 5: one value, one source).
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of defining it. No behaviour change; its existing tests, including the `VITE_API_BASE_URL` override test, keep passing unchanged.
  - `frontend/src/api/version.ts` (new): `fetchVersion(): Promise<string>`. Calls `GET` on the base URL plus `/api/version`. Throws when the response is not OK (message carries status and status text, same shape as `notes.ts`), when the body has no `version` field, when `version` is not a string, when it is empty or whitespace, or when it equals the backend sentinel `unknown`. Returns the trimmed `version` string otherwise. Ignores every other field (TEST-09 adds `commit`). A network error from `fetch` propagates as a rejection. Exports the response type `VersionResponse` with `version: string`.
  - `frontend/src/components/AppFooter.tsx` (modified): removes `import { version } from "../../package.json"`. Holds `version` in `useState` (initially `null`), calls `fetchVersion()` once in `useEffect` with the same unmount guard `LandingPage.tsx` uses for its notes load, sets the state on success, and on rejection leaves it `null`. Renders the app name always; renders a `<span data-testid="app-footer-version">` containing ` v` plus the version only when the state holds a version. The existing `data-testid="app-footer"` and the `<footer>` element (contentinfo landmark) are kept unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified** (it only renders `<AppFooter />`).
- Routes: none.
- State management: local component state in `AppFooter` (`useState` and `useEffect`). No context, no store, no data-fetching library.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The existing footer style object in `AppFooter.tsx` (font size 0.875rem, color #5f5f5f, top margin 1.5rem) is kept exactly; the version span inherits it and adds no style of its own.

## Backend Plan
No backend changes required. The tracker comment asks for a `GET /api/version` endpoint, and it already exists on main: TEST-05 shipped `backend/app/routers/version.py` (registered in `backend/app/main.py`), `backend/app/services/version_service.py` (reads `[project].version` of `task-notes-backend` from installed package metadata, falls back to `unknown`) and `backend/app/schemas/version.py`, with `backend/tests/integration/test_version_integration.py` covering it. The CORS middleware already allows `GET` from the configured frontend origin. This item therefore adds a runtime dependency of the footer on the backend, but no backend code. TEST-09 is concurrently adding a `commit` field to the same response; this plan neither depends on nor conflicts with it.

## API Integration Plan
No external API integration. The only call is to this project's own backend, through the new client module `frontend/src/api/version.ts`, following the notes client's pattern (`coding_standards.md` Section 4 applied to the own backend, as `notes.ts` already does): one client module, typed response, non-OK and unexpected-shape responses turned into thrown errors that the component absorbs into the failure state. No retry: one fetch per page load (see Re-Plan Feedback).

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no query parameters, no headers beyond the browser defaults.
- Response (existing, TEST-05): `200 OK`, a JSON object with one string field `version` (for example version `0.1.0`, the current `backend/pyproject.toml` value). After TEST-09 merges the object also carries a string field `commit`, which this client ignores.
- Client contract (`fetchVersion`): resolves to the version string when the response is OK and `version` is a non-empty string other than `unknown`; rejects in every other case (network error, non-2xx, missing or non-string or empty `version`, the `unknown` sentinel). `AppFooter` renders the resolved value and treats every rejection as the absent path.

## Technology Selection
- HTTP call for the version (`frontend/src/api/version.ts`): chose the platform `fetch` API, as `notes.ts` already does, over adding an HTTP client library such as axios, because `fetch` covers a single GET with a status check.
- Footer loading and failure state (`AppFooter.tsx`): chose React's own `useState` and `useEffect` (already installed) over a data-fetching dependency such as TanStack Query, because one fetch on mount with no caching, retry or refetch needs nothing more.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers it; it is the existing two-line `VITE_API_BASE_URL` lookup moved out of `notes.ts`, chosen over duplicating that lookup in `version.ts`, so the backend origin keeps one source.
- Version source: chose the existing backend endpoint (TEST-05, reading `backend/pyproject.toml` metadata) over a Vite `define` build-time variable or the `package.json` import, because the tracker correction requires the running backend's version, which only a runtime call can report.
- Tests: Vitest, Testing Library and Playwright are already installed; no test dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the documented default), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchVersion()` client for `GET /api/version`, typed response, rejects on non-OK, unexpected shape, empty value or the `unknown` sentinel
- [A] frontend/src/api/version.test.ts: unit tests for `fetchVersion` with `fetch` stubbed (OK, extra `commit` field ignored, non-OK, missing version, empty version, sentinel, network error, default base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser spec, footer shows the backend version from `backend/pyproject.toml` (and not the frontend `package.json` version), plus the edge case where `/api/version` is aborted and the footer reads `Task Notes` with no version
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-endpoint edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version once on mount; render the version span only when a version resolved, the app name alone while loading and on failure
- [A] frontend/src/components/AppFooter.test.tsx: replace the `package.json` version test with component tests for both paths (version present, version absent on rejection), the loading state, and the kept landmark and app-name tests, with `../api/version` mocked
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`, and assert the footer shows the mocked version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`, since the footer now shows the backend version; the spec's other assertions are unchanged

No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (the frontend already reads `VITE_API_BASE_URL`, and the backend endpoint already exists). `frontend/src/components/LandingPage.tsx` and every backend file are deliberately absent: see `## Backend Plan` and `## Re-Plan Feedback`.

## Testing Strategy
- Unit tests (frontend, Vitest, colocated `*.test.ts(x)` as the existing frontend tests are):
  - `frontend/src/api/version.test.ts`: `fetch` stubbed with `vi.stubGlobal`, as `notes.test.ts` does. Cases: OK response returns the version; OK response with an extra `commit` field still returns only the version; default base URL `http://localhost:8010/api/version` is called; non-OK (500) rejects with status and status text; body without `version` rejects; empty string `version` rejects; sentinel `unknown` rejects; a rejected `fetch` (network error) rejects.
  - `frontend/src/components/AppFooter.test.tsx`: `../api/version` mocked with `vi.mock`. Present path: `fetchVersion` resolves `9.9.9-test`, the footer eventually reads `Task Notes v9.9.9-test` and `app-footer-version` holds it. Absent path: `fetchVersion` rejects, the footer text is exactly `Task Notes`, `app-footer-version` is absent, and the text contains none of `undefined`, `null` or a trailing ` v`. Loading: with a never-settling promise, the footer reads exactly `Task Notes`. Kept: app name and contentinfo landmark with `data-testid="app-footer"`. Also asserts `fetchVersion` is called exactly once per mount.
  - `frontend/src/components/LandingPage.test.tsx`: add `vi.mock("../api/version")` resolving a fixed test version, and change the footer test to expect that value rather than the `package.json` one.
  - Backend unit tests: none added. No backend code changes; TEST-05 tests already cover `version_service`.
- Integration tests: none added (enabled per CLAUDE.md, but not warranted). This item adds or modifies no router, repository or model (`testing_standards.md` Section 6); `GET /api/version` is already covered by `backend/tests/integration/test_version_integration.py`, which this item does not change.
  - Directory: `backend/tests/integration/` (unchanged)
- E2E tests: the footer shows the running backend version on the landing page, and the edge case where `/api/version` fails.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts` (new) and `e2e/tests/TEST-04_page_footer.spec.ts` (expected version source updated)
  - Expected value: read from `backend/pyproject.toml` (`[project].version`) in the spec, the same file the backend reports from, in the way TEST-04 read `frontend/package.json`. The present-path spec also asserts the footer does not contain the frontend `package.json` version (0.0.0), which is what distinguishes the backend source from the build-time one.
  - Edge spec: `page.route` aborts the request whose URL **pathname is exactly** `/api/version` (not a substring match: Vite serves `src/api/version.ts` from a URL containing that substring, the trap TEST-03's spec documents), then asserts the footer text is exactly `Task Notes` and `app-footer-version` is absent.
  - Locators: `data-testid` (`app-footer`, `app-footer-version`).
- UAT scenarios: one Gherkin scenario per criterion plus the unreachable-endpoint edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source, never a string typed into the component (corrected: the backend, at runtime, via `GET /api/version`) | Unit | Verifying it needs no navigation or interaction: the component test proves the rendered value is whatever `fetchVersion` returns (a value no source file contains), and the client unit test proves `fetchVersion` reads `/api/version`. The E2E spec for criterion 1 additionally shows the backend value, not the frontend one, in the browser. |
| 3 | When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap | Unit | Verifying it needs no navigation or interaction: it is a render branch on a rejected promise, which the component test drives directly; the client unit tests cover each unresolvable response shape. The E2E edge spec also exercises one failure in the browser. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component test: `AppFooter.test.tsx` with both paths. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `app-footer` contains `Task Notes` and the `backend/pyproject.toml` version | Given the app and backend are running, When I open the landing page, Then the footer reads Task Notes followed by the backend version |
| 2 | Version from one declared source (the backend at runtime) | covered at Unit, see Criterion coverage; the criterion 1 spec also asserts the footer does not contain the frontend `package.json` version | Given the backend reports version 0.1.0 and the frontend package says 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version renders no version text | covered at Unit, see Criterion coverage; edge spec aborts `/api/version` and asserts the footer reads exactly `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads Task Notes with no version, undefined, null or trailing v |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When I run it, Then the AppFooter present and absent tests pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (db, backend on port 8010, frontend on port 5183). `backend/pyproject.toml` has `version = "0.1.0"` at plan time; if it has since been bumped, read the current value there and use it in place of 0.1.0 below.
1. In a terminal, run `curl -s http://localhost:8010/api/version` → the JSON body has a `version` field reading `0.1.0` (a `commit` field may also be present once TEST-09 has merged).
2. Open `http://localhost:5183/` in a browser → the landing page shows the heading `Task Notes`, the note form, and the footer at the bottom.
3. Read the footer text → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from a single declared source, never typed into the component
Prerequisites: same running stack as Criterion 1.
1. Open `frontend/package.json` → its `version` reads `0.0.0`. Open `backend/pyproject.toml` → its `version` reads `0.1.0`.
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` and does not contain `0.0.0`, so the value comes from the backend, not the frontend package metadata.
3. Open the browser developer tools, Network tab, filter on `version`, and reload the page → one `GET http://localhost:8010/api/version` request with status 200 appears.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal such as `0.1.0` and no import of `package.json`; it calls `fetchVersion` from `../api/version`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: same running stack as Criterion 1.
1. In a terminal at the repo root, run `docker compose stop backend` → the backend container stops; `curl -s http://localhost:8010/api/version` now fails to connect.
2. Open (or hard-reload) `http://localhost:5183/` → the page still renders its heading and note form.
3. Read the footer text → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or gap after the name.
4. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers again, and reload the page → the footer reads `Task Notes v0.1.0` again.
5. Loading state, optional: in developer tools set Network throttling to Slow 3G and reload → while the request is pending the footer reads `Task Notes` alone, and ` v0.1.0` appears once it completes.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root → Vitest runs `AppFooter.test.tsx` and `version.test.ts` and reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains one test where the mocked `fetchVersion` resolves and the footer shows the version, and one where it rejects and the footer reads exactly `Task Notes` with no version element.
