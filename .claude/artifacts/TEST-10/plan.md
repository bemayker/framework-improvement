# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> ## What
>
> The landing page footer shows the short build commit next to the version.
>
> ## Acceptance criteria
>
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 35 comments read (2 pages), all framework PR notices from earlier runs → not acted on because none carries feedback on the feature's content (recorded in `.claude/artifacts/TEST-10/decisions.md`).
- Assumption (no comment, criterion 2 is ambiguous): the version and the commit arrive in the same `GET /api/version` response, so while that one request is pending, and when it fails, there is no version to show either. "The version alone" is read as "the footer exactly as TEST-08 left it, with no commit part": `Task Notes` while pending and on failure (TEST-08's behaviour, unchanged), and `Task Notes v{version}` when the response carries a usable version but no usable commit (`commit` missing, empty, not a string, or the backend's `unknown` sentinel). In no state does the footer show `undefined`, `null`, `unknown` or an error text.
- Assumption (no comment, criterion 1 leaves the presentation open): the commit renders right after the version as ` ({7 chars})`, e.g. `Task Notes v0.1.0 (a1b2c3d)`, in its own `<span data-testid="app-commit">`, inside the existing footer and with the existing footer style. The backend already cuts the commit to 12 characters (TEST-09, main 81d1be2); the frontend cuts it to 7.
- Merged since the last plan: n/a (fresh plan, branched from current main 23d1b75, which already contains TEST-08 and TEST-09).

## Plan Overview
Frontend only. The existing version API client (`frontend/src/api/version.ts`, TEST-08) is widened to return the backend's version together with the short commit from the same `GET /api/version` response, and `AppFooter` renders the commit next to the version when both are usable. No new request, no new module, no backend change: TEST-09 already serves `commit`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: export a `BackendVersion` type `{ version: string; commit: string | null }` and a `SHORT_COMMIT_LENGTH = 7` constant. `fetchBackendVersion()` keeps its name and its error behaviour (throws on a non-OK answer, rejects on a network error) and now resolves `Promise<BackendVersion | null>`: `null` exactly where it returns `null` today (version missing, empty, not a string, or `unknown`); otherwise `{ version, commit }` where `commit` is `body.commit.slice(0, 7)` when `body.commit` is a non-empty string other than `unknown` (the `UNRESOLVED_BACKEND_VERSION` literal, which is also TEST-09's unknown-commit value), else `null`. The body type gains `commit?: unknown`.
  - `frontend/src/components/AppFooter.tsx`: hold the resolved `BackendVersion | null` in state instead of a string. Render `{APP_NAME}`, then the existing `<span data-testid="app-version"> v{version}</span>` when the result is non-null, then `<span data-testid="app-commit"> ({commit})</span>` only when the result is non-null and `commit !== null`. Pending and failure keep setting nothing / `null`, so the footer reads `Task Notes` exactly as today.
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (the `isMounted` guard stays).
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the existing `footerStyle` (0.875rem, #5f5f5f); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged (served by TEST-09, main 81d1be2):
- Method: GET
- URL: /api/version
- Request: none
- Response: `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`; `commit` is at most 12 characters and is `"unknown"` when `BUILD_COMMIT` is unset or blank.

Frontend client contract after this item: `fetchBackendVersion(): Promise<BackendVersion | null>`, for the response above resolving `{ version: "0.1.0", commit: "a1b2c3d" }`; for `{"version": "0.1.0", "commit": "unknown"}` resolving `{ version: "0.1.0", commit: null }`.

## Technology Selection
- Short-commit cut: chose the standard `String.prototype.slice(0, 7)` in the existing client over any helper or dependency, because the language covers it.
- Commit transport: chose to extend the installed `fetchBackendVersion` client (TEST-08) over a second request or a new client module, because the existing call already receives `commit` in the same body.
- No net-new component, module or dependency is introduced; the new `app-commit` span is markup inside the existing `AppFooter`.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case (version present, commit `unknown`, footer shows the version alone)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature writes alongside the scripts-directory one

### Modified files
- [A] frontend/src/api/version.ts: `BackendVersion` type, `SHORT_COMMIT_LENGTH`, `fetchBackendVersion` resolves `{ version, commit } | null` with the commit cut to 7 characters or `null`
- [A] frontend/src/api/version.test.ts: existing cases updated to the new return shape; new cases for the 7-character cut, a commit shorter than 7 kept whole, and `commit` missing, empty, non-string or `unknown` giving `commit: null` with the version kept
- [A] frontend/src/components/AppFooter.tsx: state holds `BackendVersion | null`; renders the `app-commit` span after the version when the commit is usable
- [A] frontend/src/components/AppFooter.test.tsx: mocks moved to the new shape; success path asserts `Task Notes v9.9.9 (a1b2c3d)`, plus version-without-commit, pending and rejected paths asserting no `app-commit` and no `undefined`/`null`/`unknown`
- [A] frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves `{ version: "4.5.6", commit: null }` instead of a bare string, so the existing footer assertion keeps type-checking and passing

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md changes: the feature alters no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already documented by TEST-09).

## Testing Strategy
- Unit tests: Vitest, frontend only.
  - `version.test.ts` (client, `fetch` stubbed as today): commit cut to 7 characters; a commit of 7 or fewer characters returned whole; `commit` missing, `""`, non-string, or `"unknown"` gives `{ version, commit: null }`; existing null-version, non-OK and network-error cases keep their behaviour under the new shape.
  - `AppFooter.test.tsx` (component, `fetchBackendVersion` mocked as today): success (`{ version: "9.9.9", commit: "a1b2c3d" }` renders `Task Notes v9.9.9 (a1b2c3d)` and `app-commit` reads ` (a1b2c3d)`); version without commit (`commit: null` renders `Task Notes v9.9.9`, no `app-commit`); pending (never-settling promise renders `Task Notes`, no `app-version`, no `app-commit`); failure (rejection renders `Task Notes`, no `app-commit`, text never matches `undefined|null|unknown`); landmark test kept.
  - Directory: frontend/src/ (co-located `*.test.ts(x)`, the existing frontend convention; CLAUDE.md's unit directory names the backend only)
  - Naming: `{Module}.test.ts` / `{Component}.test.tsx`, the existing frontend convention
- Integration tests: not warranted. No backend code, repository or endpoint changes; the endpoint's `commit` field is already covered by TEST-09's router integration tests.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: not warranted for this item; no criterion needs navigation or interaction through the UI (see Criterion coverage). No new spec. The existing `e2e/tests/TEST-08_footer_app_version.spec.ts` keeps passing unchanged in CI, where the backend runs without `BUILD_COMMIT`, reports `unknown`, and the footer therefore renders no commit.
  - Directory: e2e/tests/
  - File: none for TEST-10
- UAT scenarios: one Gherkin scenario per criterion plus the version-without-commit edge case; the manual script expands the Manual verification plan below.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | Unit | verifying it needs no navigation or interaction: it is a render of one fetched value, covered by the client test (the 7-character cut) and the component test (the rendered `Task Notes v9.9.9 (a1b2c3d)`) |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending and failure are mocked promise states the component test drives directly, which a browser could only reproduce by intercepting the request |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself the component test in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and commit a1b2c3d4e5f6, When the landing page loads, Then the footer reads "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | Pending or failed request shows the version alone, never `undefined` or an error | covered at Unit, see Criterion coverage | Given the version request fails, When the landing page loads, Then the footer reads "Task Notes" and contains no "undefined", "null", "unknown" or error text |
| 3 | A component test covers the success, pending and failure paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack built with a known commit, from the repository root: `docker compose build --build-arg BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 backend`, then `docker compose up -d`. Note the backend version in `backend/pyproject.toml` (`version = "..."`, call it V).
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading and, at the bottom, the footer.
2. Read the footer → it reads exactly `Task Notes vV (a1b2c3d)`: the 7 characters `a1b2c3d`, not the 12 `a1b2c3d4e5f6` the endpoint returns.
3. Open `http://localhost:8010/api/version` in a second tab → the JSON shows `"commit": "a1b2c3d4e5f6"`, confirming the footer cut it to 7.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 running; browser DevTools open on the Network tab.
1. In DevTools Network, right-click the `version` request and choose "Block request URL", then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text, and no error is shown elsewhere on the page.
2. Unblock the URL, set Network throttling to a custom profile with 10000 ms latency, and reload → while the `version` request is still pending the footer reads `Task Notes`; once it completes it reads `Task Notes vV (a1b2c3d)`.
3. Disable throttling. Rebuild the backend without a commit (`docker compose build backend`, then `docker compose up -d`) and reload → the backend reports `"commit": "unknown"` and the footer reads exactly `Task Notes vV`, with no `(unknown)` and no empty parentheses.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it holds one test each for the success path (footer reads `Task Notes v9.9.9 (a1b2c3d)`), the pending path (never-settling promise, footer reads `Task Notes`) and the failure path (rejected promise, footer reads `Task Notes`).
