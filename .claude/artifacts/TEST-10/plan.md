# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria:
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 53 comments on the ClickUp task, all earlier runs' bot notes (decisions.md, run=deliver-20261124T101411Z 6.1) → not acted on because none states a requirement or a correction to the description.
- Assumption (criterion 2, ambiguity, no comment resolves it): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. The footer then reads exactly what TEST-08 already shows in that state, `Task Notes` with no version, no commit, no `undefined`, no `null` and no error text. "The version alone" is read as the state where the request succeeded but carries no usable commit (`commit` is `"unknown"`, empty or absent): the footer reads `Task Notes v{version}` with no commit. Both readings are covered by tests below.
- Assumption (criterion 1): TEST-09 returns at most 12 characters; the frontend cuts to the first 7. The commit renders only beside a shown version ("next to the version"), so a response with `version` "unknown" and a real commit shows `Task Notes` alone.

## Plan Overview
Frontend only. The version API client `frontend/src/api/version.ts` (TEST-08) starts reading the `commit` field TEST-09 added and returns both values as one typed object; `AppFooter.tsx` renders the short commit in its own span right after the existing version span. No backend, route or dependency change. TEST-08's DOM contract is kept unchanged (`data-testid="app-footer"`, `data-testid="app-version"` holding exactly ` v{version}`), so `e2e/tests/TEST-08_footer_app_version.spec.ts` keeps passing without an edit.

Rendered result on success: `Task Notes v0.1.0 (4e63112)`, where ` (4e63112)` is a new `<span data-testid="app-commit">`.

Client behaviour (`fetchBackendVersion`, name kept so the existing mocks' module shape stays the same):
- Return type changes from `string | null` to `BackendVersion` = `{ version: string | null; commit: string | null }`.
- `version`: unchanged rules (non-OK response or non-string `version` throws; `""` or `"unknown"` maps to null).
- `commit`: a non-string or missing `commit`, `""` or `"unknown"` maps to null and never throws, so a backend without a usable commit still shows its version (criterion 2). Otherwise the first 7 characters (`SHORT_COMMIT_LENGTH = 7`).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: export `interface BackendVersion`, add `SHORT_COMMIT_LENGTH = 7` and the `"unknown"` commit sentinel handling, return `BackendVersion` from `fetchBackendVersion()`.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null` (null = pending or failed, as today). Render `{APP_NAME}`, then the existing version span when `version` is set, then `<span data-testid="app-commit"> ({commit})</span>` only when both `version` and `commit` are set.
  - `frontend/src/components/LandingPage.test.tsx`: its `fetchBackendVersion` mock resolves the new object shape (`{ version: "9.8.7", commit: null }`) instead of a string; no assertion changes. `LandingPage.tsx` itself is not edited.
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern.
- Design reference notes: AI freestyle. The commit inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; base from `frontend/src/api/baseUrl.ts`)
- Request: none
- Response (200, consumed as is): `{"version": "0.1.0", "commit": "4e631128d728"}`; `commit` is `"unknown"` when `BUILD_COMMIT` is unset or blank.
- Frontend client result: `{ version: "0.1.0", commit: "4e63112" }`; `{ version: "0.1.0", commit: null }` for an `"unknown"`, empty or missing commit.

## Technology Selection
- Short commit: `String.prototype.slice(0, 7)` from the standard library, chosen over any formatting helper or dependency; nothing else is needed.
- No net-new component, module or dependency otherwise: the existing client and footer are extended in place.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: footer shows the 7-character commit next to the version, and the unreachable edge case
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, commit cut to 7 characters, unknown, empty or missing commit maps to null
- [A] frontend/src/api/version.test.ts: client tests for the commit field and the new return shape
- [A] frontend/src/components/AppFooter.tsx: render the `app-commit` span after the version span
- [A] frontend/src/components/AppFooter.test.tsx: success, pending, failure and version-alone paths with the commit
- [A] frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock resolves the new object shape

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: Vitest for the client mapping (`version.test.ts`) and the footer component (`AppFooter.test.tsx`), the client mocked at module level as today.
  - Directory: beside the file under `frontend/src/` (project-standards.md Layout)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: not warranted: no backend, repository or router change (the endpoint is TEST-09's and already covered).
  - Directory: backend/tests/integration/
- E2E tests: one spec, `/api/version` fulfilled through `page.route` with a fixed body, because CI's compose build passes no `BUILD_COMMIT` and the real backend would only ever answer `"unknown"`. Locators by `data-testid`. Edge case: route aborted, footer reads `Task Notes` and holds no `app-commit`.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `shows the short build commit next to the version in the footer`, `renders the first 7 characters of the commit next to the backend version`, `returns the version and the first 7 characters of the commit from /api/version` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails`, `renders the version alone when the backend reports no commit`, `resolves a null commit for the backend unknown commit sentinel`, `resolves a null commit when the response carries no commit string` | verifying it needs no navigation or interaction: it is the component's rendering of three client states, settled by mocking the client |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the backend version`, `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails` | the criterion is the existence of the component test itself, which is the Vitest tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfil `/api/version` with `{"version":"0.1.0","commit":"4e631128d728"}`, open `/`, expect `app-commit` to have text ` (4e63112)` and `app-footer` to read `Task Notes v0.1.0 (4e63112)` | Given the backend reports commit 4e631128d728, When I open the landing page, Then the footer reads Task Notes v0.1.0 (4e63112) |
| 2 | Pending or failed shows no commit and no error | covered at Unit, see Criterion coverage; E2E edge spec aborts the route and expects `Task Notes` with no `app-commit` | Given the backend is unreachable, When I open the landing page, Then the footer reads Task Notes with no commit and no error |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the repository, When I run the AppFooter component tests, Then they pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker and Docker Compose running, repository root as working directory, ports 5183 and 8010 free.
1. In a terminal run `BUILD_COMMIT=4e631128d7285ec47eb354795bf120878553505b docker compose up -d --build` → all services report started.
2. Run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0","commit":"4e631128d728"}`.
3. Open `http://localhost:5183/` in a browser → the landing page shows the `Task Notes` heading, the note form and the footer.
4. Read the footer → it reads exactly `Task Notes v0.1.0 (4e63112)`: seven commit characters, after the version.
5. Open developer tools, Elements tab, inspect the footer → it holds `<span data-testid="app-version"> v0.1.0</span>` followed by `<span data-testid="app-commit"> (4e63112)</span>`.

### Criterion 2: While the request is pending or when it fails, the footer shows no commit and no error
Prerequisites: the stack from Criterion 1 running.
1. Run `docker compose up -d --build` without `BUILD_COMMIT` set, then `curl -s http://localhost:8010/api/version` → `commit` is `unknown`.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown`, no `undefined`.
3. In developer tools, Network tab, set throttling to `Slow 3G` and reload → while `/api/version` is still loading the footer reads exactly `Task Notes`; when it completes it reads `Task Notes v0.1.0`. Set throttling back to `No throttling`.
4. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `v`, no commit, no `undefined`, no `null` and no error text; the Elements tab shows no `app-version` and no `app-commit` element.
5. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, then reload → the footer shows the version again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the summary line reports no failed test and the command exits 0.
2. Read the run's output → `renders the first 7 characters of the commit next to the backend version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails` are listed as passed.
