# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The tracker comment recorded under Re-Plan Feedback amends criterion 2 and the "frontend only" note; where they disagree, the comment wins.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the tracker comment:** that source is the backend's own version, served at runtime by `GET /api/version`, not the frontend `package.json` or a build-time variable. A frontend rebuilt against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the footer stops importing `frontend/package.json` and fetches `GET /api/version` on mount through a new client module `frontend/src/api/version.ts`. **The endpoint already exists on `main`:** TEST-05 shipped it (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`). It returns `{"version": "<[project].version of backend/pyproject.toml>"}`, read from installed package metadata. It is registered in `backend/app/main.py`, CORS allows `GET`, and `backend/tests/integration/test_version_integration.py` covers it. "Add the endpoint" is therefore satisfied by reuse, and this plan adds none.
- Comment (tracker), same comment, loading state: "Decide and record what it shows before the fetch resolves" → Addressed by: **while the request is pending the footer renders the app name alone, `Task Notes`**. There is no version, no placeholder, no spinner and no `unknown`. The footer element (`data-testid="app-footer"`, the `contentinfo` landmark) is present from the first render, so the page layout does not move. The version is appended as ` v{version}` in its own `<span data-testid="app-footer-version">` once the request resolves. The footer is not blank because a blank footer looks like a broken page. It does not read `unknown` because that tells the reader nothing they can act on, and it would flash on every page load.
- Comment (tracker), same comment, failure state: "what it shows if /api/version is unreachable" → Addressed by: **on failure the footer renders `Task Notes` with no version span**, the same text as the pending state. Failure covers a network error, a non-OK status, an unexpected body shape (no string `version`), and a backend that reports its own sentinel `unknown` or an empty string. The UI shows no error message, and the request is not retried. This satisfies criterion 3: no `undefined`, `null`, empty gap or trailing ` v`. Treating the backend's `unknown` sentinel (`version_service.UNKNOWN_VERSION`) as unresolved is an assumption made here so that the footer never reads `unknown`, which is the answer the comment called out. The sentinel string is named as one constant in the client.
- Comment (tracker), same comment, scope: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: this is stated here and in `## Backend Plan`. The correction does make the item depend on a backend endpoint, so it is no longer "frontend only" in substance. **But this plan changes no backend file**, because TEST-05 already delivered the endpoint, and the File Manifest carries no `[B]` entry. The item now depends on the TEST-05 endpoint's response shape at runtime. `feature_map.md` already lists TEST-05 as a dependency of TEST-08.
- Comment (tracker), same comment, rationale (partial-deploy divergence) → Addressed by: the E2E spec asserts that the footer shows the **backend's** version (`0.1.0` from `backend/pyproject.toml`). It also asserts that the footer does not show the frontend package version (`0.0.0`). Both values exist today and differ, so the spec observes the divergence the comment describes.
- Dispatch note (concurrency), not a tracker comment: TEST-09 is planning a `commit` field on the same endpoint. → Addressed by: the client reads only `version` and ignores extra keys, so an additive `commit` field does not affect this item. The footer's commit display belongs to TEST-10, which depends on TEST-08. Noted in `shared_risks.md`.

## Plan Overview
This is a frontend change only. `AppFooter` becomes a component that fetches the backend version once on mount, through a new typed client `frontend/src/api/version.ts`. It renders `Task Notes v{version}` when the version resolves, and `Task Notes` alone while the request is pending or after it fails. The API base URL moves out of `frontend/src/api/notes.ts` into `frontend/src/api/config.ts`, so that the notes client and the version client read it from one source (`coding_standards.md` Section 5, "one value, one source"). Tests that pinned the old build-time source (`AppFooter.test.tsx`, `LandingPage.test.tsx`, and the TEST-04 E2E spec) are updated to the runtime source. `LandingPage.tsx` itself does not change: it already renders `<AppFooter />`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `version: string | null` in state, initially `null`. In a `useEffect` with an `isMounted` guard (the same pattern as `LandingPage.tsx`), call `getBackendVersion()`. Set the state to the resolved string. Leave it `null` when the client resolves `null` or rejects. Render `Task Notes` followed, only when `version` is a string, by ` <span data-testid="app-footer-version">v{version}</span>`. Keep `data-testid="app-footer"`, the `<footer>` element and `footerStyle` unchanged.
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, using the `VITE_API_BASE_URL ?? "http://localhost:8010"` logic moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./config` instead of defining it. Its behaviour is unchanged.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`.
    - It calls `fetch(\`${API_BASE_URL}/api/version\`)`.
    - It throws `Loading the version failed: {status} {statusText}` on a non-OK response, and throws on a body without a string `version`.
    - It resolves `null` when `version` is `""` or the backend sentinel `"unknown"` (named constant `BACKEND_UNKNOWN_VERSION`). Otherwise it resolves the version string.
    - It ignores extra fields, so TEST-09's additive `commit` field is tolerated.
    - The type `VersionResponse = { version: string }` is defined here.
  - `frontend/src/components/LandingPage.tsx`: **not modified**. It already renders `<AppFooter />`.
- Routes: none. The landing page `/` only.
- State management: local `useState` in `AppFooter`, with one request per mount. There is no context, no store and no caching.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept as is: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. The version span inherits it and has no style of its own.

## Backend Plan
No backend changes required. The tracker comment asks for a `GET /api/version` endpoint, which turns this item from frontend-only into one with a backend dependency. That endpoint already exists on `main` from TEST-05 and returns exactly what the comment asks for: the backend's own version, at runtime. This item reuses it unchanged, so no backend file appears in the File Manifest.

## API Integration Plan
No external API integration. The footer consumes this project's own backend endpoint, specified under `## API Contract`.

## API Contract
- Method: GET
- URL: `/api/version`, prefixed by `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: `200 application/json`, with a body such as `{"version": "0.1.0"}`. The value comes from the installed `task-notes-backend` distribution metadata (`[project].version` in `backend/pyproject.toml`). The backend answers `{"version": "unknown"}` when the distribution is not installed. Extra fields (TEST-09's planned `commit`) may appear and are ignored by this client.
- Client mapping: a string other than `""` or `"unknown"` resolves to that string. `""` or `"unknown"` resolves to `null`. A non-OK status, a network error or a missing or non-string `version` rejects. `AppFooter` treats both `null` and a rejection as "no version".

## Technology Selection
- Version fetch: chose the browser's native `fetch` in a small client module, over adding a data-fetching library (none is installed). The project's existing client `api/notes.ts` uses `fetch` the same way.
- Footer pending and failure state: chose React's built-in `useState` and `useEffect`, over an installed or new state or query library. There is none, and one value fetched once needs none.
- `frontend/src/api/config.ts`: chose to move the existing base-URL expression into a shared module, over duplicating it in `version.ts`. A second copy would be two sources for one deployment-dependent value. No new dependency is involved.
- Test doubles: chose Vitest's installed `vi.mock` and `vi.stubGlobal` (as `notes.test.ts` and `LandingPage.test.tsx` already use), and Playwright's installed `page.route`, over any new mocking library.
- E2E expected value: chose reading `backend/pyproject.toml` with Node's `fs` and a line match on `version = "..."` under `[project]`, over adding a TOML parser dependency. The value is a single line, so a parser is not needed.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: the single `API_BASE_URL` definition, shared by the notes and version clients
- [A] frontend/src/api/version.ts: typed `getBackendVersion()` client for `GET /api/version`
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed: ok, the `unknown` sentinel, an empty string, non-OK, a malformed body, extra fields ignored, and `VITE_API_BASE_URL` honoured
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs. The footer shows the backend's pyproject version and not the frontend package version. With `/api/version` aborted via `page.route`, it shows `Task Notes` with no version span (edge case).
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script that build-feature writes

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the backend version on mount, and render the version span only when it resolves
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`. Assert the version-present path (span shows `v0.1.0`), the version-absent path for a rejection and for `null` (text is exactly `Task Notes`, no span, no `undefined` or `null`), and the pending path (name only before resolve). Keep the landmark assertion.
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config`, with no behaviour change
- [A] frontend/src/components/LandingPage.test.tsx: drop the `package.json` version import, mock `../api/version` (`getBackendVersion` resolving `"0.1.0"`), and assert that the footer shows `v0.1.0` once it resolves
- [D] e2e/tests/TEST-04_page_footer.spec.ts: the expected version source changes from `frontend/package.json` to `backend/pyproject.toml`, because the footer now shows the backend's version. The spec's other assertions are unchanged.

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure. `docs/DEVELOPMENT.md`'s footer paragraph already describes the runtime `GET /api/version` footer, and its commit part is TEST-10's. The TEST-04 UAT script and Gherkin file are historical artifacts of a completed item and are left as they are.

## Testing Strategy
- Unit tests (Vitest, frontend): `AppFooter` with `../api/version` mocked covers the present, absent (rejected and `null`) and pending paths. The `getBackendVersion` client is tested with `fetch` stubbed. `LandingPage` is updated for the mocked version client.
  - Directory: next to the components, under `frontend/src/` (the frontend's established convention; `CLAUDE.md`'s unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: none new. This item adds no router, repository or migration. The endpoint it consumes is already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, a 200 with no database, and 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests: the footer on `/` shows the backend's version against the real backend, and with `/api/version` aborted it shows `Task Notes` only. The TEST-04 spec is updated to the backend version source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus a failure-state edge case (backend unreachable).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (the backend, at runtime via `GET /api/version`), never typed into the component | Unit | Verifying it needs no navigation or interaction. The `AppFooter` test asserts that the rendered version is the mocked client's value. The `version.test.ts` test asserts the client calls `{API_BASE_URL}/api/version`. The E2E spec for criterion 1 additionally observes backend `0.1.0` against frontend `0.0.0`. |
| 3 | When the version cannot be resolved, the footer renders without it, with no `undefined`, `null` or empty gap | Unit | Verifying it needs no navigation or interaction: it is the component's render on a rejected or `null` client result, asserted as exact text `Task Notes` with no version span. The E2E aborted-route spec is the feature's required edge case, not this criterion's covering tier. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion names the tier: it is satisfied by `AppFooter.test.tsx` itself. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`. `getByTestId("app-footer-version")` has the text `v` + the pyproject version. The footer does not contain `v0.0.0`. | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Single declared source: the backend at runtime | Covered at Unit, see Criterion coverage. Criterion 1's spec observes backend and not frontend version. | Given the backend reports version 0.1.0 and the frontend package is 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version: footer without it | Covered at Unit, see Criterion coverage. Edge-case spec: `page.route("**/api/version", r => r.abort())`, then the footer has the text `Task Notes` and `app-footer-version` has count 0. | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | Covered at Unit, see Criterion coverage | Given the frontend tests, When I run them, Then the AppFooter version-present and version-absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, the stack is running with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010). `backend/pyproject.toml` reads `version = "0.1.0"`.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ → the landing page with the "Task Notes" heading is shown.
3. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never typed into the component
Prerequisites: the stack is running as for Criterion 1. `frontend/package.json` reads `"version": "0.0.0"`.
1. Open http://localhost:5183/ and look at the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`, the frontend package's version.
2. Open the browser DevTools Network tab, filter on `version`, and reload the page → one `GET http://localhost:8010/api/version` request with status 200 and response body `{"version":"0.1.0"}` is listed.
3. Open `frontend/src/components/AppFooter.tsx` in an editor and search for `0.1.0` and for `package.json` → neither appears. The version comes only from `getBackendVersion()`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running as for Criterion 1.
1. Stop only the backend: `docker compose stop backend` → http://localhost:8010/api/version no longer answers.
2. Open http://localhost:5183/ in a fresh tab → the landing page renders, and the footer reads exactly `Task Notes`. Nothing follows it: no ` v`, no `undefined`, no `null`, no `unknown`, and no blank space before the end of the line.
3. In DevTools Elements, inspect the footer → the `<footer data-testid="app-footer">` holds only the text `Task Notes`. There is no element with `data-testid="app-footer-version"`.
4. Restart the backend with `docker compose start backend`, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies are installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run reports `0 failed`. The listed test names include one for the version-present path and one for the version-absent path.
2. Run `npm --prefix frontend test` → the whole frontend suite, including `AppFooter.test.tsx`, `LandingPage.test.tsx` and `api/version.test.ts`, reports `0 failed`.
