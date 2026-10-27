# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> Source: ClickUp task 123k99cwybm (workspace 30307190, list 901524718831), https://app.clickup.com/t/123k99cwybm.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable. The dispatch reports 13 tracker comments on the item, all prior-run bot notes; none changes the description, so the criteria above are the description's own. No PR review comments and no `[merged-since]` lines were supplied (fresh plan, base 8636197).
- Assumption (ambiguity, not blocking): the version and the commit arrive in the same `GET /api/version` response (TEST-09), so when that request is pending or fails there is no version from the backend either. "The version alone" in criterion 2 is therefore read as "exactly what TEST-08's footer shows in that state, with no commit added": `Task Notes` alone while pending or on failure (TEST-08's decided loading and failure states), `Task Notes v{version}` when the version resolved but the commit did not. No second request is added for the commit.
- Assumption (description silent): a commit the backend cannot resolve is treated like a failed commit and left out, never rendered. That covers a body with no `commit` field or a non-string one (an older backend from before TEST-09), an empty or blank string, and the backend's `unknown` sentinel (TEST-09's default when `BUILD_COMMIT` is unset). Reason: `unknown` cut to 7 characters would render `(unknown)`, which a reader cannot tell apart from a real commit, the same reasoning TEST-08 recorded for the version's own `unknown` sentinel. `docs/DEVELOPMENT.md` already documents this behaviour ("leaves the commit out when the backend reports `unknown`").
- Assumption (description silent): the commit is shown only next to a version. If the version is unresolved (TEST-08 renders `Task Notes` alone) a resolved commit is not shown on its own, because criterion 1 places it "next to the version".
- Assumption (format): rendered as `Task Notes v0.1.0 (a1b2c3d)`, the format `docs/DEVELOPMENT.md` already documents, with the commit in its own `data-testid="app-footer-commit"` span.

## Plan Overview
TEST-08 made the footer (`frontend/src/components/AppFooter.tsx`) fetch `GET /api/version` once on mount through `fetchBackendVersion()` (`frontend/src/api/version.ts`) and render `Task Notes v{version}`, or `Task Notes` alone while loading or on failure. TEST-09 added `commit` (the first 12 characters of `BUILD_COMMIT`, default `unknown`) to the same response. The client currently ignores `commit`.

This item widens the client to return both fields from the one request, `fetchBackendBuildInfo(): Promise<{ version: string | null; commit: string | null }>`, and makes the footer render the commit's first 7 characters in parentheses after the version. States:

- resolved version and commit: `Task Notes v0.1.0 (a1b2c3d)`;
- resolved version, commit unresolved (missing, non-string, blank, `unknown`): `Task Notes v0.1.0`;
- pending, request failed, or version unresolved: `Task Notes`.

Frontend only. No backend change: the endpoint already returns `commit` on main (TEST-09). `LandingPage.tsx` is not modified, which keeps this item off the files BUG-04 edits. `LandingPage.test.tsx` is modified only because it mocks the version client by its exported name, which this item renames.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): replace `fetchBackendVersion()` with `fetchBackendBuildInfo(): Promise<BackendBuildInfo>`, exporting `type BackendBuildInfo = { version: string | null; commit: string | null }`. The response type becomes `{ version: string; commit?: string }`. Unchanged behaviour for the version: throws `Loading the version failed: {status} {statusText}` on a non-OK response, throws on a body whose `version` is not a string, network errors propagate, and `version` is `null` when it is blank after trimming or equals `unknown`. New for the commit: when `body.commit` is a string, trim it; `commit` is `null` when it is not a string, is blank, or equals `unknown`; otherwise the trimmed string, unshortened (the client reports what the backend said; the display length is the footer's rule). One `UNKNOWN_SENTINEL` constant serves both fields.
  - `frontend/src/components/AppFooter.tsx` (modify): hold `buildInfo: BackendBuildInfo | null` in `useState(null)` instead of `version`; the mount `useEffect` calls `fetchBackendBuildInfo()` with the same `isMounted` guard and the same silent `catch`. Add `SHORT_COMMIT_LENGTH = 7`. Render `Task Notes`; when `buildInfo?.version` is a non-empty string, ` ` and `<span data-testid="app-footer-version">v{version}</span>`; and only then, when `buildInfo.commit` is a non-empty string, ` ` and `<span data-testid="app-footer-commit">({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. `<footer data-testid="app-footer">` and its style object are unchanged.
- Routes: none.
- State management: local component state in `AppFooter` (`useState`, `useEffect`), as TEST-08 left it; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing inline style unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the commit span adds no styling of its own, separated from the version by one space and wrapped in parentheses.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `{"version": ..., "commit": ...}` on main (TEST-09: `backend/app/schemas/version.py` declares `commit: str`, `backend/app/services/version_service.py` `get_build_commit()` truncates `BUILD_COMMIT` to 12 characters, default `unknown`). This item consumes that field and edits nothing under `backend/`.

## API Integration Plan
No external API integration. (The call is to this project's own backend through the existing client module.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL}/api/version` (default `http://localhost:8010/api/version`), unchanged.
- Request: no body, no parameters.
- Response: 200, JSON, existing shape from TEST-09, consumed as-is:

```json
{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}
```

- The client maps it to `{ version: "0.1.0", commit: "a1b2c3d4e5f6" }`; the footer shows `a1b2c3d`. `commit` equal to `unknown`, blank, missing or not a string maps to `commit: null`. Version rules are unchanged from TEST-08. Non-200, network failure or a non-string `version` reject, and the footer then renders `Task Notes` alone.

## Technology Selection
- Commit field in the version client (`frontend/src/api/version.ts`, modified): chose to extend the existing `fetch`-based client and read `commit` from the response it already receives, over a second request or a request library (none installed), because the field is already in the body TEST-08 fetches.
- Shortening the commit to 7 characters: chose the platform `String.prototype.slice` over any helper or library, because it is the whole operation.
- Response shape check for `commit`: chose a plain `typeof body.commit === "string"` check over a schema library (none installed), because one optional string field needs no validator.
- Tests: Vitest and Testing Library (installed) for the client and component tests, Playwright (installed) with `page.route` to fulfil `/api/version` with a known commit; no new dependency.
- No net-new component, module or dependency: every source change extends a file TEST-08 created; the only new files are this item's E2E spec and UAT artifacts.

## File Manifest
<!-- Phase tags: see the plan template; tags are machine-parsed. -->
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec with `/api/version` fulfilled by `page.route`: footer reads `Task Notes v0.1.0 (a1b2c3d)` for commit `a1b2c3d4e5f6`; edge case: commit `unknown` gives exactly `Task Notes v0.1.0` and no `app-footer-commit` element
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the `unknown` commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature writes alongside it

### Modified files
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` becomes `fetchBackendBuildInfo()` returning `{ version, commit }`, with the commit's null rules (missing, non-string, blank, `unknown`)
- [A] frontend/src/api/version.test.ts: retarget the existing cases to `fetchBackendBuildInfo()`; add commit cases (present and trimmed, missing, non-string, blank, `unknown`), and assert a non-OK response still throws
- [A] frontend/src/components/AppFooter.tsx: hold the build info, render `({first 7 of commit})` in an `app-footer-commit` span after the version when both resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `fetchBackendBuildInfo`; success (`Task Notes v0.1.0 (a1b2c3d)` from a 12-character commit), pending, failure, commit null with version present, and version null with commit present
- [A] frontend/src/components/LandingPage.test.tsx: mock `fetchBackendBuildInfo` instead of `fetchBackendVersion` (renamed export); assertions on the version unchanged

No lockfile changes: no dependency is added or removed.

No documentation edit: this item changes no project structure, run configuration, dependency or test infrastructure (build-feature Section 15's condition), and `docs/DEVELOPMENT.md` already describes the footer showing the first 7 characters of the commit as `Task Notes v0.1.0 (a1b2c3d)` and omitting it on `unknown`.

The TEST-04 and TEST-08 E2E specs need no edit: they assert the footer contains `Task Notes v{version}` and, on an aborted request, reads exactly `Task Notes`; both stay true with the commit appended after the version.

## Testing Strategy
- Unit tests (frontend, Vitest): the client (`version.test.ts`, `fetch` stubbed as today) returns `{ version: "0.1.0", commit: "a1b2c3d4e5f6" }` for a full body; `commit: null` for a body without `commit`, with `commit: 1`, with `"   "`, and with `"unknown"`; trims `" a1b2c3d4e5f6 "`; keeps the version rules (unknown and blank version give `version: null`, non-OK and non-string version throw, network failure propagates, `VITE_API_BASE_URL` honoured). The footer (`AppFooter.test.tsx`, `../api/version` mocked): success renders exactly `Task Notes v0.1.0 (a1b2c3d)` from commit `a1b2c3d4e5f6` and an `app-footer-commit` span reading `(a1b2c3d)`; pending (never-settling promise) renders exactly `Task Notes`; rejected renders exactly `Task Notes`; commit `null` renders exactly `Task Notes v0.1.0` with no `app-footer-commit`; version `null` with a commit renders exactly `Task Notes`; no case renders `undefined`, `null`, `unknown` or `Error`. Landmark and test-id assertions are kept.
  - Directory: beside the modules under `frontend/src/` (existing convention, run by `npm --prefix frontend test`); `backend/tests/unit/` gets nothing.
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`, matching the existing files.
- Integration tests: no new integration test. The backend behaviour this item reads (`commit` in `GET /api/version`) is already covered by `backend/tests/integration/test_version_integration.py` (TEST-09), which this item does not touch.
  - Directory: backend/tests/integration/
- E2E tests: on `/`, `page.route` matching the exact pathname `/api/version` (never a substring: Vite serves `src/api/version.ts` from a URL containing it, as the TEST-08 spec documents) fulfils `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`; expect `app-footer` to have text exactly `Task Notes v0.1.0 (a1b2c3d)` and `app-footer-commit` to read `(a1b2c3d)`. Edge case: fulfil `{"version": "0.1.0", "commit": "unknown"}` and expect exactly `Task Notes v0.1.0` with no `app-footer-commit`. The response is fulfilled rather than read from the real backend because the commit is `unknown` wherever `BUILD_COMMIT` is unset, which would make the success path unobservable.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per acceptance criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is a component render state driven by a mocked client outcome (pending, rejected, commit null), and a pending request cannot be held open deterministically in a browser without the same mocking; TEST-08's existing abort spec also still asserts the failed state |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test in `AppFooter.test.tsx`; it is satisfied by that test existing and passing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfil `/api/version` with commit `a1b2c3d4e5f6`, go to `/`, expect footer text exactly `Task Notes v0.1.0 (a1b2c3d)`; edge: commit `unknown` gives `Task Notes v0.1.0` | Given the backend reports version 0.1.0 and commit a1b2c3d4e5f6, When I open the landing page, Then the footer shows "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | Pending or failed request shows the version alone | covered at Unit, see Criterion coverage | Given the version endpoint is unreachable, When I open the landing page, Then the footer shows "Task Notes" with no commit, "undefined" or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root, start the stack with a known commit: `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
3. Read the footer → it reads `Task Notes v0.1.0 (a1b2c3d)`: the version, a space, then the first 7 characters of the commit in parentheses.
4. Right-click the footer and choose Inspect → inside `<footer data-testid="app-footer">` there is a `<span data-testid="app-footer-commit">` whose text is `(a1b2c3d)`, after the `app-footer-version` span reading `v0.1.0`.
5. Recreate the backend without a commit: `BUILD_COMMIT= docker compose up -d backend`, wait until http://localhost:8010/api/version shows `"commit":"unknown"`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone
Prerequisites: the stack from Criterion 1 running with the known commit; Chrome DevTools open.
1. In DevTools open the Network request blocking panel (Command menu, "Show Request blocking"), add the pattern `*/api/version` and enable it → the pattern is listed and checked.
2. Reload http://localhost:5183/ → the Network tab shows the `/api/version` request blocked, and the footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no error text.
3. Remove the blocking pattern, then run `docker compose stop backend` and reload http://localhost:5183/ → the footer again reads exactly `Task Notes`.
4. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, and reload → the footer reads `Task Notes v0.1.0 (a1b2c3d)` again.
5. For the pending state itself, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → 0 failed, including the test that renders the footer with a request that never settles and expects exactly `Task Notes`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root → the run reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → one test resolves the client with version `0.1.0` and commit `a1b2c3d4e5f6` and expects `Task Notes v0.1.0 (a1b2c3d)`; one returns a never-settling promise and expects exactly `Task Notes`; one rejects and expects exactly `Task Notes`; one resolves commit `null` and expects exactly `Task Notes v0.1.0`.
