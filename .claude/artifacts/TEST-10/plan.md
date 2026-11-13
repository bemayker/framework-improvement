# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error (interpreted in Re-Plan Feedback: pending and request failure keep TEST-08's recorded `Task Notes`; a resolved version with no usable commit shows `Task Notes v{version}`).
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable. The item carries 40 comments, all framework PR notices from earlier runs (recorded in `.claude/artifacts/TEST-10/decisions.md`); none changes the description, so the plan follows the description as written.
- Assumption (criterion 2, ambiguous, recorded rather than asked per `user_story_alignment.md` Section 4): the version and the commit arrive in the **same** `GET /api/version` response (TEST-09), so while that request is pending, or when it fails, no version exists to show "alone". The plan reads "the version alone" as "the footer exactly as TEST-08 left it, without a commit": pending and request failure render TEST-08's recorded states unchanged, text exactly `Task Notes` (TEST-08 Frontend Plan, "Footer states"); a response whose version resolves but whose commit is unusable (missing, not a string, blank, or the backend sentinel `unknown`) renders the version alone, `Task Notes v0.1.0`. In no state does the footer show `undefined`, `null`, `unknown`, an empty `()`, or error text. The alternative reading (show a cached or frontend-side version while pending) is rejected because TEST-08 ruled out the frontend `package.json` version as a fallback, and a second request or cache is not asked for.
- Assumption (display format, the description is silent): the commit renders after the version, separated by a space and wrapped in parentheses, `Task Notes v0.1.0 (62be9fd)`. Chosen because it reads as one build identifier and keeps TEST-08's `Task Notes v{version}` prefix intact, so every existing `toContainText(version)` assertion keeps passing.
- Assumption (where the 7-character cut lives): the API already returns at most 12 characters (TEST-09); the frontend takes the first 7 at render time (`SHORT_COMMIT_LENGTH = 7` in `AppFooter.tsx`), because "short commit" is a display rule. The client returns the commit it received, trimmed.
- Dispatch map note: "TEST-10 and BUG-04 both plausibly edit frontend/src/components/LandingPage.tsx" → Addressed by: this plan does **not** modify `frontend/src/components/LandingPage.tsx`; `AppFooter` owns its own fetch, so the render site is unchanged. It **does** modify `frontend/src/components/LandingPage.test.tsx` (one mock value: the version client now resolves an object, and `tsc -b` type-checks tests because `frontend/tsconfig.json` includes `src`). That test file is the real overlap with BUG-04; see `shared_risks.md`.
- Merged since the last plan: n/a (fresh plan, branched from current main 44390963b2fa400af53a898b04f63d5d9b502a4b, which already carries TEST-08 #772 and TEST-09 #771; an earlier TEST-10 build #766 was reverted by the Arm E reset #769, so main carries none of this item's work).

## Plan Overview
Frontend only. TEST-09 made `GET /api/version` return `{"version", "commit"}` (commit at most 12 characters, default `"unknown"`); TEST-08's footer reads only `version`. This item widens the existing client `fetchBackendVersion()` in `frontend/src/api/version.ts` to return both fields as `{ version, commit }` (commit `null` when unusable), and `AppFooter` renders `Task Notes v{version} ({first 7 of commit})` when both resolve, `Task Notes v{version}` when only the version resolves, and TEST-08's `Task Notes` while pending or on failure. One request per mount, as today. Unit tests (client and component) are updated and extended; `LandingPage.test.tsx` gets its mock value updated to the new return shape; one new E2E spec checks the rendered footer in a browser against a stubbed response; TEST-08's E2E spec is loosened from an exact match so a stack built with a real `BUILD_COMMIT` does not break it. No backend change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modified): `type VersionResponse = { version: string; commit: string }`; add `export type BackendVersion = { version: string; commit: string | null }`. `fetchBackendVersion(): Promise<BackendVersion | null>`. Non-OK status still throws the same `Loading the version failed: {status} {statusText}` error; a network error still rejects. Version rules unchanged: not a string, blank, or `"unknown"` → resolves `null` (the whole result, so the footer shows `Task Notes`). Commit rules, new: the trimmed `commit` when it is a non-empty string other than `"unknown"` (the backend's `DEFAULT_BUILD_COMMIT`), otherwise `commit: null`. Reuse the existing `UNKNOWN_VERSION` constant by renaming it to `UNKNOWN_SENTINEL` with its comment naming both backend sentinels (one value, one place). Function name kept so the mock sites in tests change only their values.
  - `frontend/src/components/AppFooter.tsx` (modified): state becomes `useState<BackendVersion | null>(null)`; add `const SHORT_COMMIT_LENGTH = 7;`; render: `null` → `Task Notes`; `{version, commit: null}` → `Task Notes v{version}`; `{version, commit}` → `Task Notes v{version} ({commit.slice(0, SHORT_COMMIT_LENGTH)})`. Keep the single text node inside `<footer data-testid="app-footer">`, the contentinfo landmark, `footerStyle`, the `isMounted` guard and the swallowed rejection exactly as TEST-08 wrote them.
- Footer states (recorded; criterion 2's interpretation is in Re-Plan Feedback):
  - Pending: exactly `Task Notes` (TEST-08, unchanged).
  - Request failure (network error, non-2xx) or unusable version: exactly `Task Notes` (TEST-08, unchanged).
  - Version resolved, commit unusable (missing, blank, `unknown`): exactly `Task Notes v0.1.0`.
  - Both resolved: exactly `Task Notes v0.1.0 (62be9fd)` for a backend commit `62be9fd76e4b`.
  - Never: `undefined`, `null`, `unknown`, `()`, a trailing space, or error text.
- Routes: none.
- State management: local `useState` + `useEffect` in `AppFooter`, unchanged shape; one request per mount, no retry, no polling.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-08's style as-is (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem); the commit is plain text in the same node, no separate styling.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": "0.1.0", "commit": "<at most 12 chars | unknown>"}` on main (TEST-09: `backend/app/services/version_service.py` `get_build_commit()`, `backend/app/schemas/version.py`, `BUILD_COMMIT` build arg in `backend/Dockerfile` and `docker-compose.yml`). This item only consumes it.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` on the backend base URL `VITE_API_BASE_URL` (default `http://localhost:8010`, the `API_BASE_URL` exported by `frontend/src/api/notes.ts`)
- Request: no body, no parameters
- Response: 200, existing TEST-09 contract

```json
{"version": "0.1.0", "commit": "62be9fd76e4b"}
```

With `BUILD_COMMIT` unset at image build time:

```json
{"version": "0.1.0", "commit": "unknown"}
```

Client result (`BackendVersion | null`): `{ version: "0.1.0", commit: "62be9fd76e4b" }`, `{ version: "0.1.0", commit: null }`, or `null`.

## Technology Selection
- Commit field parsing (`frontend/src/api/version.ts`): chose to extend the existing platform-`fetch` client over a second endpoint call or a new client module, because one response already carries both fields; no dependency considered or needed.
- Short commit (first 7 characters): chose the standard library `String.prototype.slice` over any formatting helper or dependency.
- Footer state: chose React's built-in `useState`/`useEffect`, already used by `AppFooter`, over a data-fetching library this project does not install.
- No net-new component, module or dependency: every change extends an existing file, apart from one new E2E spec and the mandated UAT artifacts.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs for the short commit next to the version, and the version-alone edge case, with `/api/version` stubbed via `page.route` fulfil
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the unknown-commit edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` (`BackendVersion | null`), commit `null` when missing, blank or `unknown`
- [A] frontend/src/api/version.test.ts: assert the object result, the commit pass-through and trim, and the null-commit cases; existing version, non-OK and default-URL tests updated to the object shape
- [A] frontend/src/components/AppFooter.tsx: hold `BackendVersion | null`, render the 7-character commit next to the version, version alone when commit is null
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve objects; success, pending, failure and null-commit paths asserted with exact text
- [A] frontend/src/components/LandingPage.test.tsx: version mock resolves `{ version: "9.8.7", commit: null }` instead of `"9.8.7"`; the footer assertion is unchanged
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: exact `toHaveText` on the resolved footer becomes a match that allows an optional ` (abcdef0)` suffix, so a stack built with a real `BUILD_COMMIT` keeps passing

`frontend/src/components/LandingPage.tsx` and `frontend/src/components/AppFooter.tsx`'s render site are the only footer touch points; `LandingPage.tsx` is not modified. `e2e/tests/TEST-04_page_footer.spec.ts` is not modified: it uses `toContainText(version)`, which the new suffix does not break.
No dependency changes, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`) is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests (Vitest, frontend): client parsing in `frontend/src/api/version.test.ts` (global `fetch` stubbed, as today) and footer render states in `frontend/src/components/AppFooter.test.tsx` (`../api/version` mocked, as today). `LandingPage.test.tsx` mock value updated only.
  - Directory: co-located `frontend/src/**/*.test.ts(x)` (existing frontend convention; `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts(x)`
- Integration tests: none new. No backend code changes; TEST-09's `backend/tests/integration/test_version_integration.py` already covers the `commit` field of the endpoint this item consumes.
  - Directory: backend/tests/integration/
- E2E tests: on `/`, with `**/api/version` fulfilled as `{"version":"0.1.0","commit":"62be9fd76e4b"}` the footer reads exactly `Task Notes v0.1.0 (62be9fd)`; edge case, fulfilled as `{"version":"0.1.0","commit":"unknown"}` the footer reads exactly `Task Notes v0.1.0`. Stubbed rather than live because the live commit depends on how the stack was built (`BUILD_COMMIT` default `unknown`). The TEST-08 spec's resolved-footer assertion is loosened to tolerate the suffix.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `shows the short build commit next to the version in the footer`, `shows the version and the first 7 characters of the commit once /api/version resolves`, `returns the version and the commit from /api/version` | — |
| 2 | While pending or on failure, the footer shows the version alone (as interpreted), never `undefined` or an error | Unit | `shows only the app name while the version request is pending`, `shows only the app name when the version request fails`, `shows the version alone when the backend reports no usable commit`, `returns a null commit when the backend reports the unknown commit sentinel or none` | verifying it needs no navigation or interaction: it is a render rule per request state over a mocked client result; the version-alone path is also exercised in the browser by the edge-case spec `shows the version alone when the backend reports an unknown commit` |
| 3 | A component test covers the success, pending and failure paths | Unit | `shows the version and the first 7 characters of the commit once /api/version resolves`, `shows only the app name while the version request is pending`, `shows only the app name when the version request fails` | the criterion is itself about the component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | Stub `**/api/version` with version `0.1.0` and commit `62be9fd76e4b`, go to `/`, `app-footer` has text exactly `Task Notes v0.1.0 (62be9fd)` | Given the backend was built with BUILD_COMMIT 62be9fd76e4beeb5ec93d5fd3e9da1a35242d049, When I open the landing page, Then the footer shows "Task Notes v0.1.0 (62be9fd)" |
| 2 | Pending or failure shows the version alone, never undefined or an error | covered at Unit, see Criterion coverage; edge-case spec stubs commit `unknown` and expects `Task Notes v0.1.0` | Given the backend was built without BUILD_COMMIT, When I open the landing page, Then the footer shows "Task Notes v0.1.0" and no "unknown" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
Prerequisites for every block: a shell at the repository root, Docker running, ports 8010 and 5183 free. Frontend on http://localhost:5183, backend on http://localhost:8010, `backend/pyproject.toml` declares `version = "0.1.0"`.

### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: the stack is down (`docker compose down`).
1. Run `docker compose build --build-arg BUILD_COMMIT=62be9fd76e4beeb5ec93d5fd3e9da1a35242d049 backend`, then `docker compose up -d --build` → all services start; `docker compose ps` shows backend and frontend running.
2. Open http://localhost:8010/api/version in the browser → the body reads `{"version":"0.1.0","commit":"62be9fd76e4b"}`.
3. Open http://localhost:5183/ → at the bottom of the landing page the footer reads exactly `Task Notes v0.1.0 (62be9fd)`: seven commit characters, after the version, in parentheses.

### Criterion 2: While the request is pending or fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack from Criterion 1 is running.
1. Open http://localhost:5183/ with DevTools open, Network tab, throttling set to "Slow 3G", and reload → while the `version` request is pending the footer reads exactly `Task Notes` (TEST-08's pending state); once it completes it reads `Task Notes v0.1.0 (62be9fd)`. Set throttling back to "No throttling".
2. In Network, right-click the `version` request, choose "Block request URL", and reload → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, `()` or error text, and the rest of the page works. Remove the block afterwards.
3. Run `docker compose down`, then `docker compose build backend` with no build arg and no `BUILD_COMMIT` in `.env`, then `docker compose up -d` → http://localhost:8010/api/version reads `{"version":"0.1.0","commit":"unknown"}`.
4. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`: the version alone, no `unknown`, no empty parentheses, no trailing space.

### Criterion 3: A component test covers the success, pending and failure paths
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`, and the output lists `shows the version and the first 7 characters of the commit once /api/version resolves`, `shows only the app name while the version request is pending` and `shows only the app name when the version request fails` as passed.
