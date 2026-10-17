# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch, read via MCP with workspace_id 30307190. The tracker comment below overrides the description where they disagree: the version source is the backend at runtime.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend, read at runtime from GET /api/version, not frontend/package.json at build time. A frontend rebuilt against an older backend shows the backend version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. Amended by the tracker comment: the loading state and the failure state are decided and recorded (see Plan Overview).
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." Addressed by: the footer stops importing `frontend/package.json` and fetches GET /api/version at runtime through a new client module `frontend/src/api/version.ts`. **No endpoint is added**: GET /api/version already exists on main from TEST-05 (`backend/app/routers/version.py`, service `backend/app/services/version_service.py`, which reads the installed `task-notes-backend` distribution version, i.e. `[project].version` in `backend/pyproject.toml`, currently 0.1.0). Frontend `package.json` is 0.0.0, so the two values differ today and the footer showing 0.1.0 is itself the proof the backend is the source.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." Addressed by: **Loading: the footer shows the app name only, `Task Notes`, with no version, no placeholder and no trailing ` v`. Failure (network error, non-2xx, or a response without a usable version): identical, `Task Notes` only.** Neither a blank footer nor `unknown`. Reason: criterion 3 asks the footer to render without the version rather than show a meaningless token, and the app name keeps the footer landmark non-empty in both states. The footer element is always rendered so layout does not shift; only the ` v0.1.0` suffix appears once the fetch resolves. The backend returns the sentinel string `unknown` when its package metadata is missing (`version_service.py`, `UNKNOWN_VERSION`); the client treats that sentinel exactly like a failure, so `unknown` never reaches the footer.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." Addressed by: it does **not** add a backend change after all. The endpoint the comment asks for shipped with TEST-05, so `## Backend Plan` reads "No backend changes required" and the manifest has no `[B]` entry. The item stays frontend only, but it now depends on the backend at runtime, which TEST-05 already satisfies (listed in depends_on).
- Other comments: the dispatching session reported 9 tracker comments read, 1 actionable (the correction above, quoted in three parts). The other 8 (one operator note about an earlier revert, seven framework PR-link or answer comments from earlier runs) are historical and not acted on because they carry no requirement.
- Assumption: the backend sentinel `unknown` counts as "cannot be resolved" under criterion 3. Assumption: the description note that this item modifies `LandingPage.tsx` is superseded by the design below, which leaves `LandingPage.tsx` untouched (the footer owns its own fetch), reducing overlap with BUG-04 and TEST-10.
- Merged since the last plan: n/a (fresh plan, branched from current main 5d29468).

## Plan Overview
Frontend only. A new client module `frontend/src/api/version.ts` calls GET /api/version and returns the version string, or `null` when the payload carries no usable version. `AppFooter.tsx` drops its `package.json` import, fetches the version once on mount, and renders `Task Notes v0.1.0` once resolved and `Task Notes` before then or on failure. The API base URL, today computed only inside `notes.ts`, moves into one shared module `frontend/src/api/config.ts` so the two clients read one source (`coding_standards.md` Section 5: one value, one source).

Files explicitly **not** touched: `frontend/src/components/LandingPage.tsx` (no change: `AppFooter` is already rendered there and takes no props), `frontend/src/components/NoteForm.tsx` and `NoteForm.test.tsx` (BUG-04 territory). Files touched: `frontend/src/components/AppFooter.tsx` (modified), `frontend/src/api/version.ts` (new). `LandingPage.test.tsx` is modified only because its footer assertion imports `package.json`.

Concurrent work: TEST-09 adds a `commit` field to the same response, additively; this client reads only `version` and ignores extra fields, so the two merge in either order. TEST-10 later reads `commit` through the same `version.ts` and `AppFooter.tsx`; it depends on this item, so no live conflict.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, resolved from `import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./config` instead of computing it. No behaviour change; the existing `notes.test.ts` (including its `vi.resetModules` plus `VITE_API_BASE_URL` case) must stay green unchanged.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. GETs `API_BASE_URL + /api/version`; throws `Loading the version failed: STATUS TEXT` on a non-OK response (same shape as `notes.ts` `requestFailed`); returns the `version` field when it is a non-empty string other than the backend sentinel `unknown`, else `null`. Exports a `VersionResponse` type with `version: string` only (TEST-09 extra fields are ignored).
  - `frontend/src/components/AppFooter.tsx` (modified): remove the `package.json` import; hold `version: string | null` in `useState(null)`; `useEffect` calls `fetchBackendVersion()` once on mount with the same `isMounted` guard `LandingPage.tsx` uses; on rejection keep `null`. Render `Task Notes` always, and ` v` plus the version only when it is non-null. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `LandingPage.tsx`: **no change.**
- Routes: none (landing page `/` only).
- State management: local `useState` plus `useEffect` inside `AppFooter`; no context, no store, no prop added to `LandingPage`.
- Loading state: `Task Notes` (no version, no placeholder). Failure state: `Task Notes` (no version, never `unknown`, never blank).
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing TEST-04 values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; text format `Task Notes v0.1.0`.

## Backend Plan
No backend changes required. GET /api/version already exists on main from TEST-05 (`backend/app/routers/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`). CORS already allows the frontend origin `http://localhost:5183` (`backend/app/core/config.py`, `DEFAULT_CORS_ORIGINS`), which is the origin the notes calls already use, so the new browser call needs no backend wiring. The tracker comment asked for this endpoint to be added; it is not added because it is already there.

## API Integration Plan
No external API integration. (The only call is to this project's own backend, through the client layer in `frontend/src/api/`.)

## API Contract
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (default `http://localhost:8010`)
- Request: no body, no query parameters.
- Response: 200, a JSON object with one string field `version`, for example the value `0.1.0`. TEST-09 (in flight) adds a string field `commit` to the same object; this client ignores it. The backend answers `unknown` as the version value when its package metadata is missing; the client maps that to `null`.
- Client result: the version string, or `null` (unusable payload or the `unknown` sentinel); a thrown `Error` on network failure or non-OK status, which `AppFooter` absorbs into `null`.

## Technology Selection
- `frontend/src/api/version.ts` (HTTP client): chose the platform `fetch`, the same call `notes.ts` already uses, over adding an HTTP library (axios or similar); no new dependency.
- Version fetch state in `AppFooter`: chose React `useState` plus `useEffect` (already installed) over a data-fetching library (React Query, SWR); one GET on mount needs no cache or retry layer.
- `frontend/src/api/config.ts` (shared base URL): no stdlib call, native platform feature or installed dependency covers sharing one Vite env value between two client modules, so it is a few lines built here, moved out of `notes.ts` rather than duplicated.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source for `API_BASE_URL` (VITE_API_BASE_URL with the documented default), shared by both API clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion` client for GET /api/version, maps the `unknown` sentinel and unusable payloads to null, throws on non-OK
- [A] frontend/src/api/version.test.ts: Vitest client tests with `fetch` stubbed: OK returns the version and calls the default URL, non-OK throws, `unknown` sentinel returns null, missing or empty version returns null
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs: footer shows the version the backend returned; footer reads exactly `Task Notes` when GET /api/version is aborted (edge case)
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of computing it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the version on mount, render `Task Notes` while loading or on failure and `Task Notes v` plus the version once resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (a value different from package.json, proving the backend is the source), loading (pending promise: text is exactly `Task Notes`), rejected fetch and null result (text exactly `Task Notes`, no `undefined`, `null`, `unknown` or trailing ` v`), and the contentinfo landmark
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` import
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` read with the version from the page GET /api/version response, since the footer no longer shows the package.json version (0.0.0 against backend 0.1.0 would fail CI)
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: reword the step that says the version matches frontend/package.json to say it matches GET /api/version
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same one-step rewording as the TEST-04 feature file

Not touched, stated explicitly: `frontend/src/components/LandingPage.tsx`, `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, and every file under `backend/`.
No dependency change, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change (the footer reads an endpoint and base URL the stack already serves and configures).

## Testing Strategy
- Unit tests (Vitest, frontend): `version.test.ts` for the client (stubbed `fetch`, the `notes.test.ts` pattern); `AppFooter.test.tsx` for the present, loading and failure renders with `../api/version` mocked; `LandingPage.test.tsx` updated so its footer assertion follows the mocked backend version. `notes.test.ts` runs unchanged as the regression check on the `config.ts` move.
  - Directory: co-located under `frontend/src/` (existing frontend convention; `backend/tests/unit/` naming applies to Python only)
  - Naming: `ModuleName.test.ts(x)`, matching the existing frontend tests
- Integration tests: none new. The only server code involved is GET /api/version, already covered by `backend/tests/integration/test_version_integration.py` from TEST-05; this item changes no backend code.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: `TEST-08_footer_app_version.spec.ts`. Spec 1 opens `/`, waits for the GET response whose URL **pathname equals exactly** `/api/version` (Vite serves the module `/src/api/version.ts`, whose URL contains the same substring; TEST-03 hit this exact trap with notes), reads its `version`, and asserts the `app-footer` contains it. Spec 2 (edge case) registers `page.route` on a predicate matching that exact pathname and aborts it, opens `/`, and asserts the footer text is exactly `Task Notes`. A substring route pattern would abort the module load and blank the whole page, so the predicate form is mandatory. `TEST-04_page_footer.spec.ts` is updated to the same response-read pattern.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source, the backend GET /api/version at runtime, never a typed string or package.json | Unit | verifying it needs no navigation or interaction: the client test asserts the call to `/api/version` and the footer test renders a mocked backend version that differs from package.json; E2E spec 1 additionally matches the live response |
| 3 | When the version cannot be resolved the footer renders without it, never `undefined`, `null`, `unknown` or a gap; loading and failure both show `Task Notes` | Unit | verifying it needs no navigation or interaction: it is the render of a pending, rejected or null fetch, which the component test drives directly; E2E spec 2 is the feature edge-case spec on top |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test; it is satisfied by `AppFooter.test.tsx` existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Spec 1: goto `/`, read the GET /api/version response, assert `app-footer` contains its version | Given the backend is running, When I open the landing page, Then the footer reads Task Notes followed by the backend version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (spec 1 also matches the live response) | Given backend version 0.1.0 and frontend package version 0.0.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; spec 2 aborts GET /api/version and asserts the footer text is exactly Task Notes | Given the backend is unreachable, When I open the landing page, Then the footer reads Task Notes with no version and no unknown |
| 4 | Component test covers present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run it, Then AppFooter.test.tsx reports 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is up with `docker compose up -d` from the repo root (backend on http://localhost:8010, frontend on http://localhost:5183).
1. Open http://localhost:5183/ in a browser → the page shows the heading `Task Notes`, the note form and, at the bottom, the footer.
2. Read the footer text → it reads `Task Notes v0.1.0` (0.1.0 is `[project].version` in `backend/pyproject.toml`).
3. Resize the window to 375 px wide (browser devtools device toolbar) → the footer is still visible and still reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as for criterion 1.
1. Open http://localhost:8010/api/version in a new tab → the browser shows a JSON object whose `version` field is `0.1.0`.
2. Open `frontend/package.json` in the repo → its `version` field is `0.0.0`.
3. Return to http://localhost:5183/ and reload → the footer reads `Task Notes v0.1.0`, the backend value, not `v0.0.0`.
4. Open devtools, Network tab, reload the page → one request to `http://localhost:8010/api/version` with status 200.
5. In `frontend/src/components/AppFooter.tsx`, search for `0.1.0` and for `package.json` → neither appears.

### Criterion 3: When the version cannot be resolved, the footer shows `Task Notes` only
Prerequisites: as for criterion 1.
1. Run `docker compose stop backend` from the repo root → the backend container stops; http://localhost:8010/api/version no longer answers.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and the footer line is still present (not blank).
3. Loading state: run `docker compose start backend`, then in devtools Network set throttling to `Slow 3G` and reload → while the version request is pending the footer reads `Task Notes`, and it changes to `Task Notes v0.1.0` once the request completes.
4. Set throttling back to `No throttling`.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repo root → `src/components/AppFooter.test.tsx`, `src/api/version.test.ts`, `src/api/notes.test.ts` and `src/components/LandingPage.test.tsx` all run, with 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test rendering a resolved backend version and tests rendering a pending, a rejected and a null version, each asserting the footer text is exactly `Task Notes`.
