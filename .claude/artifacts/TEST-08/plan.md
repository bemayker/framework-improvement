# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> Acceptance criteria:
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> Notes: Frontend only, under frontend/src/. It modifies LandingPage.tsx, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **Amended by the tracker comment (overrides the description):** the single declared source is the backend's version, read at runtime from `GET /api/version`, never `frontend/package.json` and never a build-time variable.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, the correction comment, newest actionable): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the comment overrides criterion 2's "frontend package metadata or a build-time variable". `AppFooter.tsx` stops importing `frontend/package.json` and fetches the version at runtime through a new client `frontend/src/api/version.ts`. The frontend's own `package.json` version (`0.0.0`) is no longer displayed anywhere, so a frontend bundle built against an older backend shows the backend's version (`0.1.0` today), which is the partial-deploy answer the comment asks for.
- Comment (tracker, same comment, "Add a GET /api/version endpoint"): → Addressed by: verified against current main (`ef356f9`) rather than assumed. `GET /api/version` **already exists** on main (TEST-05, done): `backend/app/routers/version.py` → `backend/app/services/version_service.py`, which reads `importlib.metadata.version("task-notes-backend")`, i.e. `[project].version` in `backend/pyproject.toml`, and answers `{"version": "0.1.0"}`, falling back to the sentinel `"unknown"` when the distribution metadata is not installed. It is registered in `backend/app/main.py`, CORS already allows `GET` from `http://localhost:5183`, and it is covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. This plan therefore consumes the existing endpoint and adds no new one; re-adding it would duplicate TEST-05's route.
- Comment (tracker, same comment, "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan"): → Addressed by: stated explicitly here and in `## Backend Plan`. The description's "Frontend only" note no longer describes the item's dependency surface: the footer now depends on the backend at runtime (a deployed frontend with no reachable backend shows no version). It does **not** add backend code, because the backend change the comment requests is already on main from TEST-05, which is one of this item's declared dependencies (`depends_on [TEST-04, TEST-05]`). The File Manifest has no `[B]` entry for that reason, and that absence is a decision, not an omission.
- Comment (tracker, same comment, loading state): "Decide and record what it shows before the fetch resolves" → Addressed by: **before the fetch resolves, the footer renders the app name alone, `Task Notes`**, with no `v`, no placeholder, no spinner and no trailing space. Chosen over a "loading…" text because the footer is informational and the fetch is one small GET: a transient word would flash on every page load and is one more state for nothing a person acts on.
- Comment (tracker, same comment, failure state): "what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: **when `/api/version` is unreachable, answers non-2xx, or returns a body without a usable version, the footer renders the app name alone, `Task Notes`.** The footer is never blank (the app name stays) and never reads `unknown`. Reason: criterion 3 says the footer "renders without it"; and `unknown` is a version-shaped string that, during a partial deploy, reads as an answer when it is the absence of one. The same rule applies to the backend's own sentinel: a 200 whose `version` is `"unknown"` (the value `version_service.UNKNOWN_VERSION` returns when metadata is missing) or a blank string is treated as unresolved and omitted, rather than rendered as `Task Notes vunknown`. Assumption recorded: the loading and failure renderings are identical on purpose, so a slow fetch and a failed one look the same; nobody needs to tell them apart in a footer.
- Comment (tracker, the other 14 comments): framework run notes from earlier, since-reverted runs and an operator reset note → not acted on because they are not requirements (per the dispatch, and `decisions.md` for this run). Where they described code (a commit field, `BUILD_COMMIT`, a footer showing the build commit) I checked current main instead: none of that exists in `backend/app/` or `frontend/src/` on `ef356f9`. `docs/DEVELOPMENT.md` line 665 still describes `BUILD_COMMIT` and a footer commit from a reverted TEST-09/TEST-10 run; that stale paragraph is outside this item's criteria and is left untouched (it is TEST-09/TEST-10's subject), noted here so the reviewer does not read it as this item's doc.
- Merged since the last plan: n/a (fresh plan, no existing `plan.md`; plan base is main HEAD `ef356f946f502e44bc16385c72d2a742625e60df`, and the dispatch carried no `[merged-since]` lines).

## Plan Overview
Frontend-only code change that consumes an endpoint already on main. The footer component (`frontend/src/components/AppFooter.tsx`, rendered by `LandingPage.tsx`) stops reading `frontend/package.json` and instead fetches `GET /api/version` once on mount through a new API client module `frontend/src/api/version.ts` (`coding_standards.md` Section 4's client-layer rule, applied to this project's own backend as `notes.ts` already does: components never call `fetch` directly). The backend base URL, today a private constant inside `frontend/src/api/notes.ts`, moves to one shared module `frontend/src/api/baseUrl.ts` that both clients import, so the backend URL keeps one source (`coding_standards.md` Section 5, "one value, one source"). `LandingPage.tsx` itself does not change: the footer owns its own fetch, which keeps the page component (also edited by BUG-04) out of this diff. The TEST-04 E2E spec, which asserts the footer shows `frontend/package.json`'s version, is updated because that behaviour is superseded by the tracker correction. No backend change, no migration, no new dependency. No timeout or retry is added to the version call: none is in the criteria, the call is to this project's own backend, and the failure path already degrades to the name-only footer (`user_story_alignment.md` Section 3).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` (same env var, same documented default; nothing widened).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring `DEFAULT_API_BASE_URL` / `API_BASE_URL` locally. Behaviour unchanged; `notes.test.ts` must stay green untouched (its `vi.resetModules()` re-import re-evaluates `baseUrl.ts` too).
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string | null>`. Calls `fetch` on `{API_BASE_URL}/api/version`. Non-OK response: throws `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`'s `requestFailed`). Network error: the `fetch` rejection propagates. Body whose `version` is not a string: throws `Error("Loading the version failed: unexpected response")`. Body whose `version` is a string that is blank after trim, or equals the backend sentinel `"unknown"`: returns `null` (the backend answered but could not resolve its version). Otherwise returns the trimmed string. Exported type `VersionResponse = { version: string }` mirrors `backend/app/schemas/version.py`. The `"unknown"` literal is a named constant (`BACKEND_UNKNOWN_VERSION`) with a comment pointing at `version_service.UNKNOWN_VERSION`, because that is the contract it mirrors.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. State `const [version, setVersion] = useState<string | null>(null)`; one `useEffect` on mount calls `getBackendVersion()`, sets the result when still mounted (the same `isMounted` guard `LandingPage.tsx` uses), and on rejection leaves it `null` with a "why" comment (the footer is informational; a failed version load must not affect the page). Render: `<footer data-testid="app-footer" style={footerStyle}>` containing `Task Notes` and, only when `version !== null`, a single space then `<span data-testid="app-footer-version">v{version}</span>`. Exact text contract: version present → footer `textContent` is `Task Notes v0.1.0` (for backend version `0.1.0`); loading or absent → footer `textContent` is exactly `Task Notes` and `app-footer-version` is not in the DOM. `footerStyle` and the `contentinfo` landmark are unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.** It already renders `<AppFooter />`.
- Routes: none.
- State management: local `useState` + `useEffect` in `AppFooter` (native React state); no context, no library.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing values unchanged: `font-size 0.875rem`, `color #5f5f5f`, `margin-top 1.5rem`; the version span inherits them and adds no style of its own. States: loading and failure both render the app name alone (see `## Re-Plan Feedback`).

## Backend Plan
No backend changes required.

Stated explicitly because the tracker correction asked for it: the item now has a **runtime backend dependency** (the footer reads `GET /api/version`), but the backend side of that dependency already exists on main from TEST-05 (router `backend/app/routers/version.py`, service `backend/app/services/version_service.py`, schema `backend/app/schemas/version.py`, registered in `backend/app/main.py`, CORS allowing `GET` from the frontend origin, tests in place). Nothing in this item's criteria changes its response, so no backend file is touched and no `[B]` entry appears in the File Manifest.

## API Integration Plan
No external API integration. (The only call is to this project's own backend, see `## API Contract`.)

## API Contract
Existing endpoint, consumed unchanged (defined by TEST-05):
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version`
- Request: no body, no parameters.
- Response: `200 application/json`, example:

```json
{"version": "0.1.0"}
```

  `version` is `[project].version` of `backend/pyproject.toml` as installed metadata, or the sentinel `"unknown"` when the metadata is missing. The frontend treats `"unknown"` and a blank string as unresolved (renders no version). Any non-2xx, a network failure, or a body without a string `version` is also unresolved.

## Technology Selection
- Version HTTP call (`frontend/src/api/version.ts`): chose the browser's native `fetch` over an HTTP client library (none installed, and `notes.ts` already uses `fetch`), because `fetch` covers a single GET with no retry requirement in the criteria.
- Footer fetch state (`AppFooter.tsx`): chose React's built-in `useState`/`useEffect` over a data-fetching library such as React Query (not installed), because one fetch on mount with a present/absent outcome needs nothing more.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers "one source for the backend URL"; it is a three-line module moved out of `notes.ts`, chosen over duplicating the constant in `version.ts`, which would give the backend URL two sources (`coding_standards.md` Section 5).
- No new dependency is added; `frontend/package.json` and its lockfile are unchanged.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the documented `http://localhost:8010` default), moved from `notes.ts`
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`, returns the version, or `null` for the backend's `unknown`/blank sentinel, throws on HTTP, network or shape failure
- [A] frontend/src/api/version.test.ts: Vitest unit tests of the client with `fetch` stubbed (happy path, default and configured base URL, `unknown` sentinel, blank, non-OK, malformed body)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs, footer shows the version the backend's `/api/version` response carried; edge case with `/api/version` aborted shows `Task Notes` only
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount via `getBackendVersion()`; render `Task Notes v{version}` with the version in `app-footer-version`, or `Task Notes` alone while loading and when unresolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (a mocked `9.9.9`, which no literal in the component could produce), absent on rejection, absent on `null`, and the loading rendering; keep the name and `contentinfo` assertions
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; replace the `package.json` version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: remove the `frontend/package.json` read and the version-from-package assertions (superseded by the tracker correction); keep the footer-visible, app-name, `contentinfo` landmark, heading and mobile-viewport assertions

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, `package-lock.json`, `backend/uv.lock`) is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (`VITE_API_BASE_URL` is the existing variable, already wired in `docker-compose.yml`). TEST-04's own UAT artifacts (`e2e/uat/scripts/TEST-04_page_footer_uat_script.md`, `e2e/uat/scenarios/TEST-04_page_footer.feature`) describe the superseded package.json behaviour and are left as TEST-04's record; Gherkin is validated for well-formedness only, so nothing executes them.

## Testing Strategy
- Unit tests (Vitest, frontend): `frontend/src/api/version.test.ts` for the client (fetch stubbed like `notes.test.ts`): returns `0.1.0` from `{"version": "0.1.0"}` at `http://localhost:8010/api/version`; uses `VITE_API_BASE_URL` when configured (assert the resolution, not the fallback literal alone); returns `null` for `"unknown"` and for `"  "`; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response; throws on `{}` and on `{"version": 42}`; propagates a rejected `fetch`. `frontend/src/components/AppFooter.test.tsx` (component tests, `../api/version` mocked): present path renders `Task Notes v9.9.9` and `app-footer-version` holds `v9.9.9`; absent path (client rejects) renders exactly `Task Notes`, no `app-footer-version`, and text contains none of `undefined`, `null`, `unknown`; absent path (client resolves `null`) same; loading (never-settling promise) renders exactly `Task Notes`; name and `contentinfo` landmark unchanged. `frontend/src/components/LandingPage.test.tsx` mocks the version client and asserts the footer shows the mocked version.
  - Directory: colocated with the source under `frontend/src/` (the existing frontend convention: `notes.test.ts`, `AppFooter.test.tsx`); `CLAUDE.md`'s unit test directory `backend/tests/unit/` is the backend's.
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing frontend files.
- Integration tests: no new integration test. The only router involved, `GET /api/version`, is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without `DATABASE_URL`, 405 on POST); this item adds no router, repository or migration (`testing_standards.md` Section 6).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts`. Spec 1 (criterion 1): `page.waitForResponse` on `**/api/version` while `page.goto("/")`, read the response JSON's `version`, assert `app-footer` contains `Task Notes` and `app-footer-version` has text `v{that version}` (no hardcoded backend host or version). Spec 2 (edge case, criterion 3): `page.route("**/api/version", route => route.abort())`, `goto("/")`, assert `app-footer` has exact text `Task Notes` and `app-footer-version` is absent (count 0), with no fixed wait. Also modify `e2e/tests/TEST-04_page_footer.spec.ts` as listed in the manifest so it stops asserting the frontend package version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page (the backend's version, per the tracker correction) | E2E | — |
| 2 | The version comes from a single declared source (amended: the backend's `GET /api/version` at runtime), never a string typed into the component | Unit | verifying it needs no navigation or interaction: the client test proves the value is read from `/api/version` and the component test proves the footer renders whatever the client returns (a mocked `9.9.9` that no literal could match), and the backend source is already unit-tested in `test_version_service_unit.py` |
| 3 | When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap | Unit | verifying it needs no navigation or interaction: it is a rendering branch, exercised by the component test with the client mocked to reject and to return `null`; the E2E edge spec additionally exercises it in a browser |
| 4 | A component test asserts both paths: version present, and version absent | Unit | it is a property of the component test itself, verified by running `frontend/src/components/AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Open `/`, capture the `/api/version` response, assert `app-footer-version` reads `v{response.version}` | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the version the backend reports |
| 2 | Version comes from a single declared source (the backend, at runtime) | covered at Unit, see Criterion coverage | Given the backend reports a version different from the frontend's package version, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version renders no version text | covered at Unit, see Criterion coverage; edge spec aborts `/api/version` and asserts the footer reads exactly `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test covers present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the footer component tests, Then the present and absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d`; the frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`; `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` → the landing page shows the `Task Notes` heading, the note form and the note list.
3. Scroll to the bottom of the landing page and read the footer → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from a single declared source (the backend, at runtime), never a string typed into the component
Prerequisites: as for Criterion 1.
1. Open `frontend/package.json` and read its `"version"` field → it reads `0.0.0`.
2. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's version, not `0.0.0`. This is the partial-deploy case: the frontend's own version differs and the footer reports the backend's.
3. Open the browser developer tools, Network tab, reload `http://localhost:5183/` → one request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no version number literal (no `0.1.0`, no `0.0.0`) and no `package.json` import.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for Criterion 1.
1. From the repository root run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183/` and read the footer → it reads exactly `Task Notes`, with no `v`, no trailing gap, and none of `undefined`, `null` or `unknown`; the rest of the page (heading, note form) still renders.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0"}`, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run lists the version-present test and the version-absent tests (client rejects, client returns null) and reports `0 failed`.
2. Run `npm --prefix frontend test` → the whole frontend suite, including `src/api/version.test.ts`, `src/components/AppFooter.test.tsx` and `src/components/LandingPage.test.tsx`, reports `0 failed`.
